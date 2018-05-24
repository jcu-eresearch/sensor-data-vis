

// --------------------------------------------------------
function getDatasetInfo(dataUrl = './data/datasets.json') {
	return fetch(dataUrl)
		.then((response) => response.json())
		.then((data) => data.datasets)
}
// --------------------------------------------------------


module.exports = {
	getDatasetInfo
}

