var fs = require("fs")
var http = require("http")

var MAX_REQUEST_DAYS = 50	//默认最多获取50天数据
var DEFAULT_N1 = 9
var DEFAULT_N2 = 3
var DEFAULT_N3 = 3

var n1 = DEFAULT_N1
var n2 = DEFAULT_N2
var n3 = DEFAULT_N3

var stockDataList = new Object()
var time = new Date()

function min(list) {
	var result = null
	for (var i = list.length - 1; i >= 0; i--) {
		if (result === null)
			result = list[i]
		else if (result > list[i])
			result = list[i]
	}
	return result
}

function max(list) {
	var result = null
	for (var i = list.length - 1; i >= 0; i--) {
		if (result === null)
			result = list[i]
		else if (result < list[i])
			result = list[i]
	}
	return result
}

function getRSV(stockInfo) {
	var result = []
	var m = 0
	var close
	var lowsList
	var highsList
	var rsv
	for (var i = 0; i < stockInfo["closes"].length; i++) {
		if (i === 0) {
			result.push(50)
			continue
		}
		var m = max([i - n1 + 1, 0])
		close = stockInfo["closes"][i]
		lowsList = stockInfo["lows"].slice(m, i + 1)
		highsList = stockInfo["highs"].slice(m, i + 1)
		rsv = (close - min(lowsList)) / (max(highsList) - min(lowsList)) * 100
		if (rsv === Infinity) {
			rsv = 50
		}
		result.push(rsv)
	}
	return result
}

function getSMA(X, N, M) {
	if (M === undefined || M >= N)
		M = 1
	var result =[]
	for (var i = 0; i < X.length; i++) {
		if (i === 0)
			result.push(X[i])
		else {
			result.push((M * X[i] + (N - M) * result[i - 1]) / N)
		}
	}
	return result
}

function getK(stockInfo) {
	return getSMA(getRSV(stockInfo), n2)
}

function getD(kList) {
	return getSMA(kList, n3)
}

function getJ(K, D) {
	var result = []
	for (var i = 0; i < K.length; i++) {
		result.push(3 * K[i] - 2 * D[i])
	}
	return result
}

function requestStockData(stock, callback) {
	http.get("http://ctxalgo.com/api/ohlc/" + stock + "?days=" + MAX_REQUEST_DAYS + "&exright=true", function(res) {
		res.setEncoding("utf8")
		var stockStr = ""
		res.on("data", function(stockInfo) {
			stockStr += stockInfo
		})
		res.on("end", function(e) {
			if (e) {
				console.error("can't get " + stock +" data")
			}
			else {
				stockData = JSON.parse(stockStr)
				for (var i in stockData) {
					if (stockData[i]["lows"].length > 1) {
						var K = getK(stockData[i])
						var D = getD(K)
						var J = getJ(K, D)
						stockDataList[stockData[i]["stock_id"]] = new Object()
						stockDataList[stockData[i]["stock_id"]]["K"] = Number(K[K.length - 1]).toFixed(3)
						stockDataList[stockData[i]["stock_id"]]["D"] = Number(D[D.length - 1]).toFixed(3)
						stockDataList[stockData[i]["stock_id"]]["J"] = Number(J[J.length - 1]).toFixed(3)
						stockDataList[stockData[i]["stock_id"]]["K_slope"] = Number(K[K.length - 1] - K[K.length - 2]).toFixed(3)
					}
					else
						console.error("%s data error", stockData[i]["stock_id"])
				}
			}
			callback()
		})
		res.on("error", console.error)
	})
}

function getStockToRequest(keys, k) {
	var result = ""
	for (var i = k; i < keys.length && i < k + 100; ++i) {
		result += "," + keys[i]
	}
	return result.slice(1)
}

fs.readFile("Stock/all_stock.json", function(err, data) {
	var stockList = JSON.parse(data)
	var keys = Object.keys(stockList)
	var k = 0
	requestStockData(getStockToRequest(keys, k), function recall() {
		k += 100
		if (k < keys.length)
			requestStockData(getStockToRequest(keys, k), recall)
		else {
			var stockDJKFileName = "Stock/stockKDJ.txt"
			fs.writeFileSync(stockDJKFileName, "stock_ID\tK\tD\tJ\tK_slope")
			var strToWrite = ""
			for (var stock in stockDataList) {
				strToWrite += "\n" + stock
				for (var i in stockDataList[stock]) {
					strToWrite += "\t" + stockDataList[stock][i]
				}
			}
			fs.appendFileSync(stockDJKFileName, strToWrite)
			console.log("stock data saved to Stock/stockKDJ.txt")
		}
	})
	
})

// var stockDJKFileName = "Stock/stockKDJ_" + 
// 	time.getMonth() + "_" + time.getDate() + "_" + time.getHours() + "_" + time.getMinutes() + ".txt"
