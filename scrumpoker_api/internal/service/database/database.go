package database

import (
	"fmt"
	"net/url"
	"strings"
	"sync"

	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

var lock = &sync.Mutex{}

type database struct {
	DB *gorm.DB
}

var dbInstance *database

func Get() *gorm.DB {
	if dbInstance == nil {
		New()
	}
	return dbInstance.DB
}

func New() *database {
	if dbInstance == nil {
		lock.Lock()
		defer lock.Unlock()
		if dbInstance == nil {
			dbInstance = &database{}
		}
	}
	return dbInstance
}

func (s *database) Init() error {
	dbUrl, err := url.Parse(viper.GetString("database.url"))
	if err != nil {
		logrus.Errorf("database.url config invalid: %s, err: %v", dbUrl, err)
		return err
	}
	dbUrl.Path = viper.GetString("database.dbname")

	if err := ensureAppTableExists(*dbUrl); err != nil {
		logrus.Errorf("create app table failed, err: %v", err)
		return err
	}

	db, err := gorm.Open(postgres.Open(dbUrl.String()), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			TablePrefix: strings.Trim(dbUrl.Path, "/") + "_",
		},
	})
	if err != nil {
		logrus.Errorf("open db connection failed, err: %v", err)
		return err
	}
	s.DB = db

	logrus.Infof("connected to host: %s@%s", dbUrl.Host, dbUrl.Path)
	return nil
}

func ensureAppTableExists(dbUrl url.URL) error {
	// connect to existing postgres first & continue to create app db
	appTable := strings.Trim(dbUrl.Path, "/")
	dbUrlPg, _ := url.Parse(dbUrl.String())
	dbUrlPg.Path = "postgres"
	dbPg, err := gorm.Open(postgres.Open(dbUrlPg.String()), &gorm.Config{})
	if err != nil {
		logrus.Errorf("open pg-db connection failed, url: %s err: %v", dbUrlPg.String(), err)
		return err
	}
	sqlPg, err := dbPg.DB()
	defer func() {
		_ = sqlPg.Close()
	}()
	if err != nil {
		logrus.Errorf("create pg-db connection failed defered, err: %v", err)
		return err
	}

	stmt := fmt.Sprintf("SELECT * FROM pg_database WHERE datname = '%s';", appTable)
	rs := dbPg.Raw(stmt)
	if rs.Error != nil {
		logrus.Errorf("query for %s failed, err: %v", appTable, rs.Error)
		return rs.Error
	}

	var rec = make(map[string]interface{})
	if rs.Find(rec); len(rec) == 0 {
		stmt := fmt.Sprintf("CREATE DATABASE %s;", appTable)
		if rs := dbPg.Exec(stmt); rs.Error != nil {
			logrus.Errorf("create table %s failed, err: %v", appTable, rs.Error)
			return rs.Error
		}

		logrus.Infof("app table: %s created", appTable)
	} else {
		logrus.Debugf("app table: %s exists", appTable)
	}

	// create extension in db
	db, err := gorm.Open(postgres.Open(dbUrl.String()), &gorm.Config{})
	if err != nil {
		logrus.Errorf("open db connection failed, url: %s err: %v", dbUrl.String(), err)
		return err
	}
	sql, err := db.DB()
	defer func() {
		_ = sql.Close()
	}()
	if err != nil {
		logrus.Errorf("create connection failed defered, err: %v", err)
		return err
	}
	if rs := db.Exec(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`); rs.Error != nil {
		logrus.Errorf("create extension uuid-ossp failed, err: %v", rs.Error)
		return rs.Error
	}
	logrus.Infof("created extension uuid-ossp")

	return nil
}
