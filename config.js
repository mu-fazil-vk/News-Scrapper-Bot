const fs = require("fs");
module.exports = {
	session: JSON.parse(
		process.env.SESSION ||
		  fs.readFileSync(__dirname + "/session.json", { encoding: "utf8" })
	  ),
	wa_grp: process.env.WA_GRP === undefined ? '' : process.env.WA_GRP,
	wa_grp_id: process.env.WA_GRP_ID === undefined ? '' : process.env.WA_GRP_ID,
	app_name: process.env.APP_NAME === undefined ? '' : process.env.APP_NAME,
  };