const { EventEmitter } = require("events");

const pm2 = require("pm2");

class PM2Mixin extends EventEmitter {
  /**
   * @param { pm2.StartOptions } options - Options
   */
  constructor(options = {}) {
    super();
    this.pm2 = pm2;
    this.StartOptions = options;
  }

  /**
   * @param { boolean } noDaemonMode - Default: false) If true is passed for the first argument
   * @returns { void | Error }
   * @description This function will connect to the pm2 daemon process. If the process is not running, it will be started.
   */
  launch(noDaemonMode = false) {
    this.pm2.connect(noDaemonMode, (err) => {
      if (err) {
        throw new Error(err);
      }

      this.#launchBus((err, bus) => {
        if (err) {
          return this.#disconnect();
        }

        bus.on("process:event", (packet) => {
          this.emit("status", {
            name: packet.process.name,
            unique_id: packet.process.unique_id,
            pm_id: packet.process.pm_id,
            status: packet.process.status,
            pwd: packet.process.pm_cwd,
            entry_point: packet.process.pm_exec_path,
            event: packet.event,
          });
        });

        bus.on("log:out", (packet) => {
          this.emit("output", {
            log_message: packet.data,
            process: packet.process,
            at: new Intl.DateTimeFormat("pt-BR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }).format(new Date()),
          });
        });

        bus.on("log:err", (packet) => {
          this.emit("error", {
            error_message: packet.data,
            process: packet.process,
            at: new Intl.DateTimeFormat("pt-BR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }).format(new Date()),
          });
        });
      });

      this.#start(this.StartOptions, (err) => {
        if (err) {
          return this.#disconnect();
        }
      });
    });
  }

  /**
   * @description Disconnect from the pm2 daemon process.
   * @returns { void }
   */
  #disconnect() {
    this.pm2.disconnect();
  }

  /**
   * @param { number | string } process -  The process id or name.
   * @param { (err: Error, result: any ) => void } callback - An errback called when the process has been stopped.
   * @description Stops a process managed by pm2.
   * @returns { void }
   */
  flush(process, callback) {
    this.pm2.flush(process, callback);
  }

  /**
   * @param { (err: Error, bus: any) => void } callback
   * @description This allow to receive message from process managed with PM2.
   */
  #launchBus(callback) {
    this.pm2.launchBus(callback);
  }

  /**
   * @private
   * @param { pm2.StartOptions } options - Options
   * @param {(err: Error, apps: pm2.Proc) => void} callback - An errback called when the script has been started.
   * @description Starts a script that will be managed by pm2.
   */
  #start(options, callback) {
    this.pm2.start(options, callback);
  }
}
