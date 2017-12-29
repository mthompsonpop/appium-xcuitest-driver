import _ from 'lodash';
import { iosCommands } from 'appium-ios-driver';
import { IOSCrashLog } from '../device-log/ios-crash-log';
import { IOSLog } from '../device-log/ios-log';
import log from '../logger';
import { SafariConsoleLog } from '../device-log/safari-console-log';

let extensions = {};

Object.assign(extensions, iosCommands.logging);

extensions._getFullLogTypes = extensions.getFullLogTypes;
extensions.getFullLogTypes = async function () {
  let logTypes = await this._getFullLogTypes();
  logTypes.safariConsole = 'Safari Console Logs - data written to the JS console in Safari';
  return logTypes;
};


extensions.startLogCapture = async function () {
  this.logs = this.logs || {};
  if (!_.isUndefined(this.logs.syslog) && this.logs.syslog.isCapturing) {
    log.warn('Trying to start iOS log capture but it has already started!');
    return true;
  }
  if (_.isUndefined(this.logs.syslog)) {
    this.logs.crashlog = new IOSCrashLog({
      sim: this.opts.device,
      udid: this.isRealDevice() ? this.opts.udid : undefined,
    });
    this.logs.syslog = new IOSLog({
      sim: this.opts.device,
      udid: this.isRealDevice() ? this.opts.udid : undefined,
      showLogs: this.opts.showIOSLog,
      realDeviceLogger: this.opts.realDeviceLogger,
    });
    this.logs.safariConsole = new SafariConsoleLog(!!this.opts.showSafariConsoleLog);
  }
  try {
    await this.logs.syslog.startCapture();
  } catch (err) {
    log.warn(`Continuing without capturing device logs: ${err.message}`);
    return false;
  }
  await this.logs.crashlog.startCapture();
  await this.logs.safariConsole.startCapture();

  return true;
};

export default extensions;
