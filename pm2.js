import { process } from "./config.json";
import { resolve } from "path";
// import { io } from "socket.io-client";
import pm2 from "pm2";

// const socket = socketClient(socket.origin, {
//   autoConnect: true,
//   protocols: ["websocket"],
//   reconnection: true,
// });

pm2.connect((err) => {
  if (err) {
    process.exit(1);
  }

  pm2.flush(process.name, (err) => {
    if (err) {
      pm2.disconnect();
    }
  });

  pm2.launchBus((err, bus) => {
    if (err) {
      pm2.disconnect();
    }

    bus.on("process:event", (packet) => {
      const processInfo = {
        name: packet.process.name,
        unique_id: packet.process.unique_id,
        pm_id: packet.process.pm_id,
        status: packet.process.status,
        pwd: packet.process.pm_cwd,
        entry_point: packet.process.pm_exec_path,
        event: packet.event,
      };

      console.log(processInfo);
    });
  });

  pm2.start(
    {
      script: resolve("src", "main.js"),
      name: process.name,
      instances: 1,
    },
    (err) => {
      if (err) {
        pm2.disconnect();
      }
    }
  );
});
