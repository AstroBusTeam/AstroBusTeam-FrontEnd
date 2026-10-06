// entidad conductor
export class Driver {
    constructor({ id = null, employeeCode = '', firstName = '', lastName = '', dni = '', category = '',
                  licenseNumber = '', licenseExpiry = '', points = 0, rating = 0, yearsExperience = 0, status = 'active' }) {
        this.id = id;
        this.employeeCode = employeeCode;
        this.firstName = firstName;
        this.lastName = lastName;
        this.dni = dni;
        this.category = category;
        this.licenseNumber = licenseNumber;
        this.licenseExpiry = licenseExpiry;
        this.points = points;
        this.rating = rating;
        this.yearsExperience = yearsExperience;
        this.status = status;
    }

    // nombre completo
    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }

    // iniciales para el avatar
    get initials() {
        return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
    }

    // true si puede trabajar
    get isActive() {
        return this.status === 'active';
    }
}
