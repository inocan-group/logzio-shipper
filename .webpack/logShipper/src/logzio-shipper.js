(function(e, a) { for(var i in a) e[i] = a[i]; }(exports, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/logzio-shipper.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/log-shipper/parser.ts":
/*!***********************************!*\
  !*** ./src/log-shipper/parser.ts ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nObject.defineProperty(exports, \"__esModule\", { value: true });\nfunction functionName(logGroup) {\n    console.log(\"determining function name\");\n    return logGroup\n        .split(\"/\")\n        .reverse()[0]\n        .split(\"-\")\n        .pop();\n}\nexports.functionName = functionName;\nfunction lambdaVersion(logStream) {\n    let start = logStream.indexOf(\"[\");\n    let end = logStream.indexOf(\"]\");\n    return logStream.substring(start + 1, end);\n}\nexports.lambdaVersion = lambdaVersion;\nlet tryParseJson = function (str) {\n    try {\n        return JSON.parse(str);\n    }\n    catch (e) {\n        return null;\n    }\n};\nfunction logMessage(logEvent) {\n    if (logEvent.message.startsWith(\"START RequestId\") ||\n        logEvent.message.startsWith(\"END RequestId\")) {\n        return null;\n    }\n    else if (logEvent.message.startsWith(\"REPORT RequestId\")) {\n        const [all, requestId, duration, billedDuration, memorySize, memoryUsed] = logEvent.message.match(/REPORT RequestId: ([0-9a-z\\-]*).*Duration: ([0-9]*\\.[0-9]*) ms.*Billed Duration:\\s*([0-9]*) ms.*Memory Size: ([0-9]*).*Max Memory Used: ([0-9]*) MB/);\n        return {\n            message: `REPORT for ${requestId}`,\n            kind: \"report\",\n            requestId,\n            durationUsed: Number(duration),\n            durationBilled: Number(billedDuration),\n            memSize: Number(memorySize),\n            memUsed: Number(memoryUsed)\n        };\n    }\n    let parts = logEvent.message.split(\"\\t\", 3);\n    let timestamp = parts[0];\n    let requestId = parts[1];\n    let event = parts[2];\n    let fields = tryParseJson(event);\n    if (fields) {\n        fields.requestId = requestId;\n        let level = (fields.level || \"debug\").toLowerCase();\n        let message = fields.message;\n        delete fields.level;\n        delete fields.message;\n        return { level, message, fields, \"@timestamp\": new Date(timestamp) };\n    }\n    else {\n        return {\n            level: \"debug\",\n            message: event,\n            \"@timestamp\": new Date(timestamp)\n        };\n    }\n}\nexports.logMessage = logMessage;\n\n\n//# sourceURL=webpack:///./src/log-shipper/parser.ts?");

/***/ }),

/***/ "./src/logzio-shipper.ts":
/*!*******************************!*\
  !*** ./src/logzio-shipper.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst common_types_1 = __webpack_require__(/*! common-types */ \"common-types\");\nconst util_1 = __webpack_require__(/*! util */ \"util\");\nconst zlib_1 = __webpack_require__(/*! zlib */ \"zlib\");\nconst axios_1 = __webpack_require__(/*! axios */ \"axios\");\nconst parse = __webpack_require__(/*! ./log-shipper/parser */ \"./src/log-shipper/parser.ts\");\nconst gunzipAsync = util_1.promisify(zlib_1.gunzip);\nvar LOGZIO_PORTS;\n(function (LOGZIO_PORTS) {\n    LOGZIO_PORTS[LOGZIO_PORTS[\"BULK_HTTP\"] = 8070] = \"BULK_HTTP\";\n    LOGZIO_PORTS[LOGZIO_PORTS[\"BULK_HTTPS\"] = 8071] = \"BULK_HTTPS\";\n    LOGZIO_PORTS[LOGZIO_PORTS[\"TCP\"] = 5050] = \"TCP\";\n    LOGZIO_PORTS[LOGZIO_PORTS[\"TCP_CERT\"] = 5052] = \"TCP_CERT\";\n})(LOGZIO_PORTS || (LOGZIO_PORTS = {}));\nconst PORT = LOGZIO_PORTS.BULK_HTTPS;\nconst HOST = process.env.LOG_HOST || \"https://listener.logz.io\";\nconst TOKEN = process.env.LOG_TOKEN;\nconst ENDPOINT = `${HOST}:${PORT}?token=${TOKEN}`;\nif (!TOKEN) {\n    throw new Error(`No TOKEN for Logz.io was found as ENV variable \"LOG_TOKEN\"; please set and retry.`);\n}\nexports.handler = async function handler(event, context, callback) {\n    context.callbackWaitsForEmptyEventLoop = false;\n    try {\n        const request = common_types_1.getBodyFromPossibleLambdaProxyRequest(event);\n        console.log(event);\n        const payload = new Buffer(request.awslogs.data, \"base64\");\n        const json = (await gunzipAsync(payload)).toString(\"utf-8\");\n        const logEvents = JSON.parse(json);\n        await processAll(logEvents);\n        const message = `Successfully processed ${logEvents.logEvents.length} log events.`;\n        console.log(message);\n        callback(null, {\n            message\n        });\n    }\n    catch (e) {\n        callback(e);\n    }\n};\nasync function processAll(event) {\n    let lambdaVersion = parse.lambdaVersion(event.logStream);\n    let functionName = parse.functionName(event.logGroup);\n    console.log(`Shipper PORT: ${PORT}, HOST: ${HOST}`);\n    const logEntries = [];\n    console.log(`There are ${event.logEvents.length} events to ship`);\n    event.logEvents.map(logEvent => {\n        try {\n            let log = parse.logMessage(logEvent);\n            if (log) {\n                log.logStream = event.logStream;\n                log.logGroup = event.logGroup;\n                log.lambdaFunction = functionName;\n                log.lambdaVersion = lambdaVersion;\n                log.fields = log.fields || {};\n                log[\"@x-correlation-id\"] = log.fields[\"x-correlation-id\"];\n                log[\"@fn\"] = log.fields[\"fn\"];\n                log[\"@region\"] = log.fields.awsRegion;\n                log[\"@stage\"] = log.fields.stage;\n                log.fnMemory = Number(log.fields[\"functionMemorySize\"]);\n                log.fnVersion = log.fields[\"functionVersion\"];\n                log.requestId = log.fields[\"requestId\"];\n                log.kind = log.fields[\"kind\"] || log.kind;\n                log.type = \"JSON\";\n                log.token = token;\n                delete log.fields.stage;\n                delete log.fields[\"x-correlation-id\"];\n                delete log.fields[\"functionMemorySize\"];\n                delete log.fields[\"functionVersion\"];\n                delete log.fields[\"region\"];\n                delete log.fields[\"requestId\"];\n                delete log.fields[\"kind\"];\n                delete log.fields[\"fn\"];\n                delete log.fields[\"awsRegion\"];\n                delete log.fields[\"functionName\"];\n                logEntries.push(JSON.stringify(log).replace(/\\n/g, \"\"));\n            }\n        }\n        catch (err) {\n            console.error(err.message);\n            throw err;\n        }\n    });\n    console.log(`Log Payload ${endpoint} ]:`, logEntries.join(\"\"));\n    const results = await axios_1.default.post(endpoint, logEntries.join(\"\\n\"));\n    console.log(\"SHIPPING RESULT\", results);\n}\n\n\n//# sourceURL=webpack:///./src/logzio-shipper.ts?");

/***/ }),

/***/ "axios":
/*!************************!*\
  !*** external "axios" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"axios\");\n\n//# sourceURL=webpack:///external_%22axios%22?");

/***/ }),

/***/ "common-types":
/*!*******************************!*\
  !*** external "common-types" ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"common-types\");\n\n//# sourceURL=webpack:///external_%22common-types%22?");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"util\");\n\n//# sourceURL=webpack:///external_%22util%22?");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"zlib\");\n\n//# sourceURL=webpack:///external_%22zlib%22?");

/***/ })

/******/ })));