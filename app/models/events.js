class Event {
    constructor(connection) {
        this.connection = connection;
    }

    get collection() {
        return 'events';
    }

    get rules() {
        return new this.connection.Schema({
            event: {
                type: String,
                trim: true,
            }
        });
    }

    get name() {
        return 'ModelEvent';
    }

    get model() {
        return this.connection.model(
            this.name,
            this.rules,
            this.collection
        );
    }
}

module.exports = Event;