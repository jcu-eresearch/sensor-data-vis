

// --------------------------------------------------------
function queryVar(varName, defaultValue) {
	const query = window.location.search.substring(1)
	const vars = query.split("&")
	let pair = null
	for (let i=0; i < vars.length; i++) {
		pair = vars[i].split("=")
		if (pair[0] === varName) { return pair[1] }
	}
	if (defaultValue) { return defaultValue }
	return false
}
// --------------------------------------------------------
function hasClass(element, className) {
	return (element.className.indexOf(className) != -1)
}
// --------------------------------------------------------
function addClass(element, className) {
	if (hasClass(element, className)) { return }
	element.className = ('' + element.className + ' ' + className).trim()
}
// --------------------------------------------------------
function removeClass(element, className) {
	if (hasClass(element, className)) {
		const regex = new RegExp('(\\s|^)' + className + '(\\s|$)')
		element.className = element.className.replace(regex, ' ')
	}
}
// --------------------------------------------------------
function selectOption(select, option) {
	// set the option to selected
	option = select.querySelector('[value="' + option + '"]')
	option.selected = true
	// trigger select change event

	let event
	if (typeof(Event) === 'function') {
		event = new Event('change')
	} else {
		event = document.createEvent('Event')
		event.initEvent('change', true, true)
	}

	select.dispatchEvent(event)
}
// --------------------------------------------------------
function findParent(element, parentTag) {
	const tag = parentTag.toUpperCase()
	let parent = element.parentElement
	while (parent && parent.tagName !== tag) {
		parent = parent.parentElement
	}
	return parent
}
// --------------------------------------------------------
// --------------------------------------------------------
module.exports = {
	queryVar,
	hasClass, addClass, removeClass,
	selectOption,
	findParent
}