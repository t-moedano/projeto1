const RESPONSIBLE_NUMBER = '4442';

/**
 * Post new transactions, insert to Air Table
 * @returns 
 */
function postTransaction() {
    //validate fields
    let value = document.getElementById("name-value").value;
    const merchantName = document.getElementById("name-merchant").value;
    const transactionType = document.getElementById("transaction").value;
    if(!value || !merchantName || !transactionType) {
        alert("Todos os campos são obrigatórios!");
        return;
    }

    if(value.length < 3) {
        alert('Preencher Valor corretamente!');
        return;
    }

    value = value.replace(',', '.');
    value = parseFloat(value);
    if(transactionType == "-" ) {
        value = value * -1;
    }
    postOrUpdateAirTable(value, merchantName, transactionType);

}

function loadInfoToTable(table) {
    getInfoFromAirTable(RESPONSIBLE_NUMBER)
    .then(merchantItems => createTableFromArray(table, merchantItems.records));
}

function createTableFromArray(table, merchantItemsArray) {

    //sum result
    let finalResult = 0;

    // Clear Table
    let tableBody = table.querySelector('tbody');
    tableBody.innerHTML = "<tr></tr>";

    if(merchantItemsArray.length === 0) {
        let text = 'Não há transações cadastradas';
        let rowElement = document.createElement('tr');
        generateCellElement('', rowElement, false, false);
        generateCellElement(text, rowElement, true, false);
        generateCellElement('', rowElement, false, true);
        tableBody.appendChild(rowElement);
    }

    else {
        for (const item of JSON.parse(merchantItemsArray[0].fields.Json)) {
            const rowElement = document.createElement('tr');
            console.log(item);
            let value = item.value;
            if(value) {
                
                finalResult += value;
                value = Math.abs(value).toFixed(2);
                value = "R$ " + value;
                value = value.replace(',', '.');
            }
            const type = item.type;
            const name = item.name;
            generateCellElement(type, rowElement, false, false);
            generateCellElement(name, rowElement, true, false);
            generateCellElement(value, rowElement, false, true);
            tableBody.appendChild(rowElement);
        }
    }
    

    // generate sum
    let sum = document.getElementById('sum');
    console.log(finalResult);
    let finalResultText = finalResult.toFixed(2);
    finalResultText = "R$ " + finalResultText;
    sum.innerHTML = finalResultText;

    // generate text
    let text = document.getElementById('result');
    if(finalResult >= 0) {
        text.innerHTML = '[LUCRO]';
    }
    else {
        text.innerHTML = '[PREJUÍZO]'
    }
}

function generateCellElement(textContent, rowElement, isCenter, isRight) {
    const cellElement = document.createElement('td');
    cellElement.textContent = textContent;
    cellElement.classList.add('row-style');
    cellElement.classList.add('font-size');

    if(isCenter) {
        cellElement.textContent = '';
        cellElement.classList.add('center')
        const divElement = document.createElement('div');
        divElement.classList.add('block-style');
        divElement.classList.add('font-style-left');
        divElement.innerHTML = textContent;
        cellElement.appendChild(divElement);
    }

    if(isRight) {
        cellElement.classList.add('font-style-right');
    }
    rowElement.appendChild(cellElement);
}

function getInfoFromAirTable(responsible) {
    return fetch('https://api.airtable.com/v0/appRNtYLglpPhv2QD/Historico?filterByFormula='+encodeURI(`{Responsavel} = '${responsible}'&sort%5B0%5D%5Bdirection%5D=asc`), {
        method: 'GET',
        headers: {
            Authorization: 'Bearer key2CwkHb0CKumjuM',
            'Content-Type': 'application/json'
        },
    })
    .then(response => { return response.json() })
    .then(json => { return json });
}

function postOrUpdateAirTable(value, merchantName, transactionType) {
    getInfoFromAirTable(RESPONSIBLE_NUMBER)
    .then(merchantItems => {
        console.log(merchantItems)
        if(merchantItems.records.length === 0) {
            console.log(merchantItems)
            postToAirTable(value, merchantName, transactionType);
        }
        else {
            updateToAirTable(value, merchantName, transactionType, merchantItems);
        }
    })
}

function updateToAirTable(value, merchantName, transactionType, merchantItems) {
    console.log(merchantItems.records[0]);
    let jsonArray = JSON.parse(merchantItems.records[0].fields.Json);
    jsonArray.push({
        type: transactionType,
        name: merchantName,
        value
    });
    let jsonArrayString = JSON.stringify(jsonArray);
    fetch(`https://api.airtable.com/v0/appRNtYLglpPhv2QD/Historico`, {
        method: 'PATCH',
        headers: {
            Authorization: 'Bearer key2CwkHb0CKumjuM',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            {
                records: [
                    {
                        id: merchantItems.records[0].id,
                        fields: {
                            Responsavel: RESPONSIBLE_NUMBER,
                            Json: jsonArrayString
                        }
                    }
                ]
            }
        )
    })
    .then(response => { return response.json() })
    .then(json => loadInfoToTable(document.querySelector('table')));
}

function postToAirTable(value, merchantName, transactionType) {
    fetch('https://api.airtable.com/v0/appRNtYLglpPhv2QD/Historico', {
        method: 'POST',
        headers: {
            Authorization: 'Bearer key2CwkHb0CKumjuM',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            {
                records: [
                    {
                        fields: {
                            Responsavel: RESPONSIBLE_NUMBER,
                            Json: JSON.stringify([
                                {
                                    type: transactionType,
                                    name: merchantName,
                                    value
                                }
                            ])
                        }
                    }
                ]
            }
        )
    })
    .then(response => { return response.json() })
    .then(json => loadInfoToTable(document.querySelector('table')));
}

function confirmClearTable() {
    if (confirm("Deseja realmente excluir todos os dados?")) {
        clearTable();
    }
}

function clearTable() {
    getInfoFromAirTable(RESPONSIBLE_NUMBER)
    .then(merchantItems => { deleteAirTable(merchantItems.records); })
}

function deleteAirTable(records) {
    let queryString = '';
    arrayCount = 0;
    console.log(records);
    for(let record of records) {
        console.log('aqui');
        let id = record.id;
        if(!queryString)
            queryString += encodeURI('?records[]='+id);
        else
            queryString += encodeURI('&records[]='+id);
        arrayCount = arrayCount+1;
        if(arrayCount === 10) {
            fetch('https://api.airtable.com/v0/appRNtYLglpPhv2QD/Historico'+queryString, {
                method: 'DELETE',
                headers: {
                    Authorization: 'Bearer key2CwkHb0CKumjuM',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                loadInfoToTable(document.querySelector('table'))
            })
            queryString = '';
            arrayCount = 0;
        }
    }
    console.log(queryString);
    if(queryString) {
        fetch('https://api.airtable.com/v0/appRNtYLglpPhv2QD/Historico'+queryString, {
            method: 'DELETE',
            headers: {
                Authorization: 'Bearer key2CwkHb0CKumjuM',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            loadInfoToTable(document.querySelector('table'))
        })
    }
}

function formatElement(number) {
    number = format(number);
    document.getElementById("name-value").value = number;
}

function format(number) {
    let formattedNumber = number.replace(/\D/g,'');
    if(formattedNumber.length > 11) {
        formattedNumber = formattedNumber.slice(0, -1);
    }
	formattedNumber = (formattedNumber/100).toFixed(2) + '';
	formattedNumber = formattedNumber.replace(".", ",");
	formattedNumber= formattedNumber.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,");
	formattedNumber = formattedNumber.replace(/(\d)(\d{3}),/g, "$1.$2,");
	return formattedNumber;
}


module.exports = format;

