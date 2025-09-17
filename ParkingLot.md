# Smart Parking Lot System - Low-Level Design (LLD)


## Functional Requirements
* Parking Spot Allocation: Assign spots based on vehicle size (Motorcycle, Car, Bus).
* Check-In and Check-Out: Record vehicle entry/exit times.
* Parking Fee Calculation: Calculate fees based on duration and vehicle type.
* Real-Time Availability: Update parking spot availability in real-time.

## Non-Functional Requirements
- Low coupling, high cohesion, modular, extensible, handles concurrency.

## Assumptions
- 4 floors, 200 spots (50/floor).
- Single entry/exit point.
- FCFS spot allocation.
- Rates: Motorcycle (20Rs/hr), Car (50Rs/hr), Bus (Rs/hr).
- Payment methods: Cash, Card, Wallet.
- 24/7 operation.

## Identifying the Major Entities of the System
* **Vehicle**
  - Base entity for all vehicles.
* **VehicleType (Motorcycle, Car, Bus)**
  - IS-A relationship with Vehicle (Inheritance).
* **ParkingSpot**
  - HAS-A (Weak) Vehicle ==> Aggregation.
* **ParkingSpotType (SMALL, MEDIUM, LARGE)**
  - Modeled as ENUM associated with ParkingSpot; ENUM preferred for simplicity.
* **ParkingFloor**
  - HAS-A (Strong) ParkingSpot (One-to-Many, Composition).
  - HAS-A (Strong) DisplayBoard.
* **EntryPanel**
  - Uses Vehicle (Association).
  - Uses ParkingFloor (Association).
  - Uses Ticket (Association).
  - HAS-A (Strong) DisplayBoard.
* **ExitPanel**
  - Uses Ticket (Association).
  - Uses ParkingFloor (Association).
  - HAS-A (Strong) DisplayBoard.
* **Ticket**
  - Uses Vehicle (Association).
  - Uses ParkingSpot (Association).
* **PaymentProcessor**
  - Uses Ticket (Association).
* **DisplayBoard**
  - Responsibility: Showing availability for ParkingLot, ParkingFloor, EntryPanel, ExitPanel.
* **ParkingLot**
  - HAS-A (Strong) ParkingFloor (Composition).
  - HAS-A (Strong) EntryPanel (Composition).
  - HAS-A (Strong) ExitPanel (Composition).
  - Uses Vehicle (Association).


## Database Schema
- **Vehicles**:
  - id (PK, SERIAL)
  - registration_number (VARCHAR, UNIQUE)
  - color (VARCHAR)
  - type (ENUM: 'MOTORCYCLE', 'CAR', 'BUS')
- **ParkingSpots**:
  - id (PK, SERIAL)
  - floor_id (FK, INTEGER, REFERENCES ParkingFloors(id))
  - status (ENUM: 'EMPTY', 'OCCUPIED')
  - type (ENUM: 'SMALL', 'MEDIUM', 'LARGE')
  - vehicle_id (FK, INTEGER, REFERENCES Vehicles(id), NULLABLE)
- **ParkingFloors**:
  - id (PK, SERIAL)
  - lot_id (FK, INTEGER, REFERENCES ParkingLots(id))
  - floor_number (INTEGER)
  - capacity (INTEGER)
- **Tickets**:
  - id (PK, SERIAL)
  - vehicle_id (FK, INTEGER, REFERENCES Vehicles(id))
  - spot_id (FK, INTEGER, REFERENCES ParkingSpots(id))
  - entry_time (TIMESTAMP)
  - exit_time (TIMESTAMP, NULLABLE)
  - fee (DECIMAL, NULLABLE)
- **Payments**:
  - id (PK, SERIAL)
  - ticket_id (FK, INTEGER, REFERENCES Tickets(id))
  - amount (DECIMAL)
  - method (ENUM: 'CASH', 'CARD', 'WALLET')
  - paid_at (TIMESTAMP)
- **ParkingLots**:
  - id (PK, SERIAL)
  - name (VARCHAR)
  - total_floors (INTEGER)
  - total_capacity (INTEGER)

## Spot Allocation Algorithm
1. Map<ParkingSpotType, PriorityQueue<ParkingSpot>> per floor for O(1) access.
2. For vehicle:
   - Match type to spot (Motorcycle: SMALL, Car: MEDIUM, Bus: LARGE).
   - Check lowest floor first; assign earliest EMPTY spot.
   - Update status, queue, and DisplayBoard.
3. On exit: Free spot, update queue and board.

## Fee Calculation
- Duration = ceil((exit_time - entry_time) / 1hr).
- Fee = duration * rate (SMALL: 10Rs, MEDIUM: 50Rs, LARGE: 100Rs).
- Edge cases:  (SMALL: 10Rs, MEDIUM: 50Rs, LARGE: 100Rs) min fee if duration < 1hr.


## Detail Design
### Vehicle
+ registrationNumber (String)
+ color (String)
----------------
+ getRegistrationNumber(): String
+ getColor(): String

### Motorcycle
+ engineSize (String)
----------------
+ getEngineSize(): String

### Car
+ fastTag (String)
+ model (String)
+ fuelType (String)
+ type (ENUM: 'HATCHBACK', 'SUV', 'MPV')
----------------
+ getFastTag(): String
+ getModel(): String
+ getFuelType(): String
+ getType(): String

### Bus
+ capacity (Integer)
----------------
+ getCapacity(): Integer

### ParkingSpot
+ id (Integer)
+ status (ENUM: 'EMPTY', 'OCCUPIED')
+ type (ENUM: 'SMALL', 'MEDIUM', 'LARGE')
+ vehicle (Vehicle, nullable)
----------------
+ getStatus(): String
+ getType(): String
+ parkVehicle(vehicle: Vehicle): void
+ unparkVehicle(): void

### ParkingSpotType
+ SMALL (String)
+ MEDIUM (String)
+ LARGE (String)
----------------
+ No methods (ENUM)

### ParkingFloor
+ id (Integer)
+ floorNumber (Integer)
+ spots (Array<ParkingSpot>)
+ displayBoard (DisplayBoard)
+ availableSpotsByType (Map<ParkingSpotType, Array<ParkingSpot>>)
----------------
+ getAvailableCounts(): Object
+ updateDisplayBoard(): void

### EntryPanel
+ parkingLot (ParkingLot)
+ displayBoard (DisplayBoard)
----------------
+ checkIn(vehicle: Vehicle): Ticket
+ getRequiredSpotType(vehicle: Vehicle): String

### ExitPanel
+ parkingLot (ParkingLot)
+ displayBoard (DisplayBoard)
----------------
+ checkOut(ticket: Ticket, paymentMethod: String): Object

### Ticket
+ id (Integer)
+ vehicle (Vehicle)
+ spot (ParkingSpot)
+ entryTime (Timestamp)
+ exitTime (Timestamp, nullable)
+ fee (Decimal)
----------------
+ calculateFee(): Decimal

### PaymentProcessor
+ No attributes
----------------
+ processPayment(ticket: Ticket, amount: Decimal, method: String): void

### DisplayBoard
+ No attributes
----------------
+ update(counts: Object): void

### ParkingLot
+ id (Integer)
+ name (String)
+ floors (Array<ParkingFloor>)
+ entryPanel (EntryPanel)
+ exitPanel (ExitPanel)
----------------
+ getOverallAvailability(): Object
