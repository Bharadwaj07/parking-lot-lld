const ParkingSpotStatus = {
  EMPTY: 'EMPTY',
  OCCUPIED: 'OCCUPIED'
};

const ParkingSpotType = {
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE'
};

const CarType = {
  HATCHBACK: 'HATCHBACK',
  SUV: 'SUV',
  MPV: 'MPV'
};

class Vehicle {
  constructor(registrationNumber, color) {
    this.registrationNumber = registrationNumber;
    this.color = color;
  }

  getRegistrationNumber() {
    return this.registrationNumber;
  }

  getColor() {
    return this.color;
  }
}

class Motorcycle extends Vehicle {
  constructor(registrationNumber, color, engineSize) {
    super(registrationNumber, color);
    this.engineSize = engineSize;
  }

  getEngineSize() {
    return this.engineSize;
  }
}

class Car extends Vehicle {
  constructor(registrationNumber, color, fastTag, model, fuelType, type) {
    super(registrationNumber, color);
    this.fastTag = fastTag;
    this.model = model;
    this.fuelType = fuelType;
    this.type = type;
  }

  getFastTag() {
    return this.fastTag;
  }

  getModel() {
    return this.model;
  }

  getFuelType() {
    return this.fuelType;
  }

  getType() {
    return this.type;
  }
}

class Bus extends Vehicle {
  constructor(registrationNumber, color, capacity) {
    super(registrationNumber, color);
    this.capacity = capacity;
  }

  getCapacity() {
    return this.capacity;
  }
}

class ParkingSpot {
  constructor(id, type) {
    this.id = id;
    this.status = ParkingSpotStatus.EMPTY;
    this.type = type;
    this.vehicle = null;
  }

  getStatus() {
    return this.status;
  }

  getType() {
    return this.type;
  }

  parkVehicle(vehicle) {
    if (this.status !== ParkingSpotStatus.EMPTY) throw new Error('Spot occupied');
    this.vehicle = vehicle;
    this.status = ParkingSpotStatus.OCCUPIED;
  }

  unparkVehicle() {
    if (this.status !== ParkingSpotStatus.OCCUPIED) throw new Error('Spot empty');
    this.vehicle = null;
    this.status = ParkingSpotStatus.EMPTY;
  }
}

class DisplayBoard {
  update(counts) {
    console.log(`Availability: ${JSON.stringify(counts)}`);
  }
}

class ParkingFloor {
  constructor(id, floorNumber, spots) {
    this.id = id;
    this.floorNumber = floorNumber;
    this.spots = spots;
    this.displayBoard = new DisplayBoard();
    this.availableSpotsByType = new Map();
    Object.values(ParkingSpotType).forEach(type => {
      this.availableSpotsByType.set(type, spots.filter(s => s.type === type && s.status === ParkingSpotStatus.EMPTY));
    });
  }

  getAvailableCounts() {
    const counts = {};
    Object.values(ParkingSpotType).forEach(type => {
      counts[type] = this.availableSpotsByType.get(type).length;
    });
    return counts;
  }

  updateDisplayBoard() {
    this.displayBoard.update(this.getAvailableCounts());
  }
}

class Ticket {
  constructor(id, vehicle, spot, entryTime) {
    this.id = id;
    this.vehicle = vehicle;
    this.spot = spot;
    this.entryTime = entryTime;
    this.exitTime = null;
    this.fee = 0;
  }

  calculateFee() {
    if (!this.exitTime) throw new Error('Not exited');
    const duration = Math.ceil((this.exitTime - this.entryTime) / (1000 * 60 * 60));
    const rates = { [ParkingSpotType.SMALL]: 10, [ParkingSpotType.MEDIUM]: 50, [ParkingSpotType.LARGE]: 100 };
    this.fee = Math.max(rates[this.spot.type], duration * rates[this.spot.type]);
    if (duration * 60 <= 60) this.fee = rates[this.spot.type]; // min fee  if less than 60 minutes
    return this.fee;
  }
}

class PaymentProcessor {
  processPayment(ticket, amount, method) {
    console.log(`Processed ${amount} via ${method} for ticket ${ticket.id}`);
  }
}

class EntryPanel {
  constructor(parkingLot) {
    this.parkingLot = parkingLot;
    this.displayBoard = new DisplayBoard();
  }

  async checkIn(vehicle) {
    let spot = null;
    for (const floor of this.parkingLot.floors.sort((a, b) => a.floorNumber - b.floorNumber)) {
      const type = vehicle instanceof Motorcycle ? ParkingSpotType.SMALL :
                   vehicle instanceof Car ? ParkingSpotType.MEDIUM :
                   vehicle instanceof Bus ? ParkingSpotType.LARGE : null;
      if (!type) throw new Error('Invalid vehicle');
      const available = floor.availableSpotsByType.get(type);
      if (available.length > 0) {
        spot = available.shift();
        spot.parkVehicle(vehicle);
        floor.updateDisplayBoard();
        break;
      }
    }
    if (!spot) throw new Error('No spots');
    const ticket = new Ticket(Date.now(), vehicle, spot, Date.now());
    this.displayBoard.update(this.parkingLot.getOverallAvailability());
    return ticket;
  }
}

class ExitPanel {
  constructor(parkingLot) {
    this.parkingLot = parkingLot;
    this.displayBoard = new DisplayBoard();
  }

  async checkOut(ticket, paymentMethod) {
    ticket.exitTime = Date.now();
    const fee = ticket.calculateFee();
    new PaymentProcessor().processPayment(ticket, fee, paymentMethod);
    ticket.spot.unparkVehicle();
    const floor = this.parkingLot.floors.find(f => f.spots.includes(ticket.spot));
    floor.availableSpotsByType.get(ticket.spot.type).push(ticket.spot);
    floor.updateDisplayBoard();
    this.displayBoard.update(this.parkingLot.getOverallAvailability());
    return { fee, status: 'PAID' };
  }
}

class ParkingLot {
  constructor(id, name, floors) {
    this.id = id;
    this.name = name;
    this.floors = floors;
    this.entryPanel = new EntryPanel(this);
    this.exitPanel = new ExitPanel(this);
  }

  getOverallAvailability() {
    const total = {};
    this.floors.forEach(floor => {
      const counts = floor.getAvailableCounts();
      Object.keys(counts).forEach(type => {
        total[type] = (total[type] || 0) + counts[type];
      });
    });
    return total;
  }
}

// Example Usage
const spots = [
  new ParkingSpot(1, ParkingSpotType.SMALL),
  new ParkingSpot(2, ParkingSpotType.MEDIUM),
  new ParkingSpot(3, ParkingSpotType.LARGE)
];
const floor = new ParkingFloor(1, 1, spots);
const lot = new ParkingLot(1, "City Lot", [floor]);
const vehicle = new Car("ABC123", "Blue", "FT123", "Sedan", "Petrol", CarType.SUV);
lot.entryPanel.checkIn(vehicle).then(ticket => {
  console.log(`Ticket issued: ${ticket.id}`);
  setTimeout(() => {
    lot.exitPanel.checkOut(ticket, "CARD").then(result => {
      console.log(`Checkout: ${JSON.stringify(result)}`);
    });
  }, 1000 * 60 * 10);
});