
const schemes = {
	dutch: [
		'rgb(255, 195, 18)',
		'rgb(196, 229, 56)',
		'rgb(18, 203, 196)',
		'rgb(253, 167, 223)',
		'rgb(237, 76, 103)',
		'rgb(238, 90, 36)',
		'rgb(0, 148, 50)',
		'rgb(6, 82, 221)',
		'rgb(153, 128, 250)',
		'rgb(131, 52, 113)',
		'rgb(247, 159, 31)',
		'rgb(163, 203, 56)',
		'rgb(18, 137, 167)',
		'rgb(217, 128, 250)',
		'rgb(181, 52, 113)',
		'rgb(234, 32, 39)',
		'rgb(0, 98, 102)',
		'rgb(27, 20, 100)',
		'rgb(87, 88, 187)',
		'rgb(111, 30, 81)'
	]
}

function hashString(str) {
    var hash = 0, i = 0, len = str.length
    while ( i < len ) {
        hash  = ((hash << 5) - hash + str.charCodeAt(i++)) << 0
    }
    return Math.abs(hash)
}

function pickColor(str, scheme) {
	console.log('picking a colour')
	scheme = scheme || "dutch"
	const hash = hashString(str)
	const list = schemes[scheme]

	console.log('returning a colour')
	return(list[hash % list.length])
}

module.exports = {
	pickColor
}