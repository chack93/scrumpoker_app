package session

import (
	"github.com/chack93/scrumpoker_api/internal/service/database"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

func CreateSession(model *Session) (err error) {
	model.SetInit()
	if err = database.Get().Create(model).Error; err != nil {
		logrus.Errorf("failed, err: %v", err)
	}
	return
}

func ListSession(modelList *[]Session) (err error) {
	if err = database.Get().Find(modelList).Error; err != nil {
		logrus.Errorf("failed, err: %v", err)
	}
	return
}

func ReadSession(id uuid.UUID, model *Session) (err error) {
	if err = database.Get().First(&model, id).Error; err != nil {
		logrus.Errorf("failed, id: %s, err: %v", id.String(), err)
	}
	return
}

func ReadSessionJoinCode(joinCode string, model *Session) (err error) {
	if err = database.Get().Where("join_code = ?", joinCode).First(&model).Error; err != nil {
		logrus.Errorf("failed, joinCode: %s, err: %v", joinCode, err)
	}
	return
}

func UpdateSession(id uuid.UUID, model *Session) (err error) {
	model.SetUpdate()
	if err = database.Get().Save(model).Error; err != nil {
		logrus.Errorf("failed, id: %s, err: %v", model.ID.String(), err)
	}
	return
}

func DeleteSession(id uuid.UUID, model *Session) (err error) {
	if err = ReadSession(id, model); err != nil {
		logrus.Errorf("read failed, id: %s, err: %v", model.ID.String(), err)
		return
	}
	if err = database.Get().Delete(model).Error; err != nil {
		logrus.Errorf("failed, id: %s, err: %v", model.ID.String(), err)
	}
	return
}
