//TO-DO Implemet limit for Queue (which shouldn't be hit, but just in case)
module.exports = class QueueManager {
    queue = [];
    maxTickets;
    interval; //in ms
    fine_time;

    constructor() {
        //read config file
        this.maxTickets = 100;
        this.interval = 120000;
        this.fine_time = this.interval / this.maxTickets;
        this.startTimer();
    }

    startTimer() {
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setInterval(this.dispatch.bind(this), this.fine_time);
    }

    queueUp(callback, arg) {
        this.queue.push({ callback, arg });
    }

    dispatch() {
        if (this.queue.length !== 0) {
            let val = this.queue.shift();
            let func = val.callback;
            let arg = val.arg;
            func(arg);
        }
    }
};
