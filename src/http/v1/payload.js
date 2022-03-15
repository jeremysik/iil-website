class Payload {

    constructor(req, res) {
        this.status = 200;
        this.error = false;
        this.data = {};

        this.res = res;
    }

    success(data = {}, status = 200) {
        this.status = status;
        this.data = data;
        
        return this;
    }

    fail(error, status = 500) {
        this.error = error;
        this.status = status;
        
        return this;
    }

    send() {
        this.res.writeHead(this.status, {
            'Connection': 'close',
            'Content-Type': 'application/json'
        });

        this.res.end(JSON.stringify({
            status: this.status,
            error: this.error,
            data: this.data
        }));
    }

    sendDataOnly() {
        this.res.writeHead(this.status, {
            'Connection': 'close',
            'Content-Type': 'application/json'
        });

        this.res.end(JSON.stringify(this.data));
    }

}

module.exports = Payload;
