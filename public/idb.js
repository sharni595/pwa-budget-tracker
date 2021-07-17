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
    db.createObjectStore('pending', { autoIncrement: true });
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
    const transaction = db.transaction(['pending'], 'readwrite');
    const store = transaction.objectStore('pending');
    store.add(record);
}

function checkDatabase() {
    const transaction = db.transaction(['pending'], 'readwrite');
    const store = transaction.objectStore('pending');
    const getAll = store.getAll();
    
    getAll.onsuccess = function(){
        if(getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.results),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if(serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    //open one more transaction
                    const transaction = db.transaction(['pending'], 'readwrite');
                    const store = transaction.objectStore('pending');
                    //clear all items in your store
                    store.clear();

                    alert('All saved budgets have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

window.addEventListener('online', checkDatabase);