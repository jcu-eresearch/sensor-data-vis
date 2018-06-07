

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
	let event = document.createEvent('HTMLEvents')
	event.initEvent('change', true, true)
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
	hasClass, addClass, removeClass,
	selectOption,
	findParent
}