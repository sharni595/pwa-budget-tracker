const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;

let db;
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
}

request.onsuccess = function(event) {
    db = event.target.result;
    if(navigator.onLine){
        checkDatabase();
    }
}

request.onerror = function(event) {
    console.log(event.target.errorCode);
}

function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const store = transaction.objectStore('new_transaction');
    store.add(record);
}

function checkDatabase() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const store = transaction.objectStore('new_transaction');
    const getAll = store.getAll();
    
    getAll.onsuccess = function(){
        if(getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if(serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    //open one more transaction
                    const transaction = db.transaction(['new_transaction'], 'readwrite');
                    const store = transaction.objectStore('new_transaction');
                    //clear all items in your store
                    store.clear();

                    alert('All saved expenses have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

window.addEventListener('online', checkDatabase);