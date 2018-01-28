class Domain {
    constructor(connection) {
        this.connection = connection;
    }

    get collection() {
        return 'domains';
    }

    get rules() {
        return new this.connection.Schema({
            domain: {
                type: String,
                trim: true,
            }
        });
    }

    get name() {
        return 'ModelDomain';
    }

    get model() {
        return this.connection.model(
            this.name,
            this.rules,
            this.collection
        );
    }
}

module.exports = Domain;