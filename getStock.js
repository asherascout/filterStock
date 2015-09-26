var fs = require("fs")
var http = require("http")

var allStock = ""
http.get("http://ctxalgo.com/api/stocks", function(res) {
	res.setEncoding("utf8")
	res.on("data", function(data) {
		allStock += data
	})
	res.on("end", function() {
		fs.writeFile("Stock/all_stock.json", allStock, function(err) {
			if (err)
				console.error("save all_stock error!")
			else
				console.log("all_stock saved")
		})
	})
})