package config

import (
	"io"
	"os"

	"github.com/sirupsen/logrus"
)

// Logger wraps logrus.Logger for application use
type Logger struct {
	*logrus.Logger
}

// NewJSONLogger creates a new logger with JSON formatting
func NewJSONLogger(development bool) *Logger {
	logger := logrus.New()

	// Set output to stdout
	logger.Out = os.Stdout

	// Set formatter based on environment
	if development {
		logger.SetFormatter(&logrus.TextFormatter{
			FullTimestamp: true,
		})
	} else {
		logger.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: "2006-01-02T15:04:05.000Z",
		})
	}

	// Set level (will be overridden by config)
	logger.SetLevel(logrus.InfoLevel)

	return &Logger{logger}
}

// WithField adds a field to the logger
func (l *Logger) WithField(key string, value interface{}) *Logger {
	return &Logger{l.Logger.WithField(key, value)}
}

// WithFields adds fields to the logger
func (l *Logger) WithFields(fields logrus.Fields) *Logger {
	return &Logger{l.Logger.WithFields(fields)}
}

// WithError adds an error field to the logger
func (l *Logger) WithError(err error) *Logger {
	return &Logger{l.Logger.WithError(err)}
}