package vehicle

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/0xEmmyb2/CipherPass/internal/config"
	"github.com/0xEmmyb2/CipherPass/pkg/database"
)

// Service provides vehicle management operations
type Service struct {
	db     *database.PostgresDB
	logger config.LoggerInterface
}

// NewService creates a new vehicle service
func NewService(db *database.PostgresDB, logger config.LoggerInterface) *Service {
	return &Service{
		db:     db,
		logger: logger,
	}
}

// Vehicle represents a vehicle in the system
type Vehicle struct {
	ID              string    `json:"id"`
	UserID          string    `json:"user_id"`
	PlateNumber     string    `json:"plate_number"`
	Make            string    `json:"make"`
	Model           string    `json:"model"`
	Year            int       `json:"year"`
	Color           string    `json:"color"`
	ChassisNumber   string    `json:"chassis_number"`
	EngineCapacity  string    `json:"engine_capacity"`
	Category        string    `json:"category"` // CAR, MOTORCYCLE, TRUCK, BUS
	RegistrationStatus string  `json:"registration_status"` // ACTIVE, PENDING, EXPIRED
	InsuranceStatus string    `json:"insurance_status"` // VALID, EXPIRING_SOON, EXPIRED
	InspectionStatus string   `json:"inspection_status"` // VALID, EXPIRING_SOON, EXPIRED
	DocumentsCount  int       `json:"documents_count"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// AddVehicle creates a new vehicle record
func (s *Service) AddVehicle(ctx context.Context, userID string, vehicleData map[string]interface{}) (*Vehicle, error) {
	// Extract and validate required fields
	plateNumber, okPlate := vehicleData["plateNumber"].(string)
	if !okPlate || plateNumber == "" {
		return nil, errors.New("plate_number is required")
	}
	make, okMake := vehicleData["make"].(string)
	if !okMake || make == "" {
		return nil, errors.New("make is required")
	}
	model, okModel := vehicleData["model"].(string)
	if !okModel || model == "" {
		return nil, errors.New("model is required")
	}
	yearFloat, okYear := vehicleData["year"].(float64)
	if !okYear {
		return nil, errors.New("year is required and must be a number")
	}
	year := int(yearFloat)
	color, okColor := vehicleData["color"].(string)
	if !okColor || color == "" {
		return nil, errors.New("color is required")
	}
	chassisNumber, okChassis := vehicleData["chassisNumber"].(string)
	if !okChassis || chassisNumber == "" {
		return nil, errors.New("chassis_number is required")
	}
	engineCapacity, okEngine := vehicleData["engineCapacity"].(string)
	if !okEngine || engineCapacity == "" {
		return nil, errors.New("engine_capacity is required")
	}
	category, okCategory := vehicleData["category"].(string)
	if !okCategory || category == "" {
		return nil, errors.New("category is required")
	}

	// Validate category
	validCategories := map[string]bool{
		"CAR": true, "MOTORCYCLE": true, "TRUCK": true, "BUS": true,
	}
	if !validCategories[category] {
		return nil, errors.New("category must be one of: CAR, MOTORCYCLE, TRUCK, BUS")
	}

	// Insert vehicle into database
	var vehicleID string
	err := s.db.QueryRowContext(ctx,
		`INSERT INTO vehicles (user_id, plate_number, make, model, year, color, chassis_number, engine_capacity, category, registration_status, insurance_status, inspection_status, documents_count)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		 RETURNING id`,
		userID, plateNumber, make, model, year, color, chassisNumber, engineCapacity, category,
		"ACTIVE", "VALID", "VALID", 0,
	).Scan(&vehicleID)

	if err != nil {
		s.logger.WithError(err).Error("Failed to create vehicle record")
		return nil, err
	}

	// Fetch the created vehicle
	vehicle, err := s.GetVehicleByID(ctx, vehicleID, userID)
	if err != nil {
		return nil, err
	}

	return vehicle, nil
}

// GetVehicleByID retrieves a vehicle by its ID for a specific user
func (s *Service) GetVehicleByID(ctx context.Context, vehicleID string, userID string) (*Vehicle, error) {
	var v Vehicle
	err := s.db.QueryRowContext(ctx,
		`SELECT id, user_id, plate_number, make, model, year, color, chassis_number, engine_capacity, category,
		        registration_status, insurance_status, inspection_status, documents_count, created_at, updated_at
		 FROM vehicles WHERE id = $1 AND user_id = $2`,
		vehicleID, userID,
	).Scan(
		&v.ID, &v.UserID, &v.PlateNumber, &v.Make, &v.Model, &v.Year, &v.Color, &v.ChassisNumber,
		&v.EngineCapacity, &v.Category, &v.RegistrationStatus, &v.InsuranceStatus, &v.InspectionStatus,
		&v.DocumentsCount, &v.CreatedAt, &v.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("vehicle not found")
		}
		s.logger.WithError(err).Error("Failed to query vehicle")
		return nil, err
	}

	return &v, nil
}

// GetVehiclesByUserID retrieves all vehicles for a specific user
func (s *Service) GetVehiclesByUserID(ctx context.Context, userID string) ([]Vehicle, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, user_id, plate_number, make, model, year, color, chassis_number, engine_capacity, category,
		        registration_status, insurance_status, inspection_status, documents_count, created_at, updated_at
		 FROM vehicles WHERE user_id = $1 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		s.logger.WithError(err).Error("Failed to query vehicles")
		return nil, err
	}
	defer rows.Close()

	var vehicles []Vehicle
	for rows.Next() {
		var v Vehicle
		err := rows.Scan(
			&v.ID, &v.UserID, &v.PlateNumber, &v.Make, &v.Model, &v.Year, &v.Color, &v.ChassisNumber,
			&v.EngineCapacity, &v.Category, &v.RegistrationStatus, &v.InsuranceStatus, &v.InspectionStatus,
			&v.DocumentsCount, &v.CreatedAt, &v.UpdatedAt,
		)
		if err != nil {
			s.logger.WithError(err).Error("Failed to scan vehicle")
			continue
		}
		vehicles = append(vehicles, v)
	}

	if err = rows.Err(); err != nil {
		s.logger.WithError(err).Error("Error iterating vehicle rows")
		return nil, err
	}

	return vehicles, nil
}