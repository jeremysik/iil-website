let values = {};

function snakeToCamel(string) {
    return string.toLowerCase(
    ).replace(/([-_][a-z])/g, (group) => {
        return group.toUpperCase(
        ).replace(
            '-',
            ''
        ).replace(
            '_', 
            ''
        );
    });
}

function updateRadioColours(name, value) {
    document.querySelectorAll(`input[name="${name}"]`).forEach((element) => {
        if(element.value <= value) {
            element.classList.add('svg-yellow');
            element.classList.remove('svg-grey');
            return; // Continue
        }

        element.classList.remove('svg-yellow');
        element.classList.add('svg-grey');
    });
}

function onRadioClick(e) {
    let selectedValue = e.target.value;
    let name          = e.target.name;
    if(values[name] == selectedValue) {
        e.target.checked = false;
        selectedValue    = 0;
    }

    values[name] = selectedValue;
    updateRadioColours(name, selectedValue);
}

function onRadioMouseOver(e) {
    let tempValue = e.target.value;
    let name      = e.target.name;

    updateRadioColours(name, tempValue);
}

function onRadioMouseLeave(e) {
    let name = e.target.name;
    updateRadioColours(name, values[name]);
}

document.addEventListener('TemplatesLoaded', function() {
    [].forEach.call(document.getElementsByClassName('form-check-input'), (element) => {
        values[snakeToCamel(element.name)] = 0;
    });
});