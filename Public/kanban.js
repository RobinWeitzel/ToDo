const Store = require('electron-store');
const Dialogs = require('dialogs');

const store = new Store();
const dialogs = Dialogs();

const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

let data;
let archive;
let selectedCard;
let selectedStack;

const createStack = obj => {
    const stack = document.createElement('div');
    stack.classList.add('stack');
    stack.classList.add(obj.color);
    stack.ondrop = drop;
    stack.ondragover=allowDrop;
    stack.id = obj.id || uuidv4();

    // Title
    const p = document.createElement('p');
    p.classList.add('stack-title');
    const span = document.createElement('span');
    span.id = obj.id + "-title";
    span.appendChild(document.createTextNode(obj.title));
    p.appendChild(span);
    stack.appendChild(p);

    const i = document.createElement('i');
    i.classList.add('fas');
    i.classList.add('fa-cog');
    i.classList.add('stack-edit');
    i.onclick = openEdit(obj);
    p.appendChild(i);

    // Add new card button
    const p2 = document.createElement('p');
    p2.classList.add('stack-new');
    const i2 = document.createElement('i');
    i2.classList.add('fas');
    i2.classList.add('fa-plus');
    p2.appendChild(i2);
    p2.appendChild(document.createTextNode("Add new card"));
    p2.onclick = () => {
        const card = {
            id: uuidv4(),
            title: "",
            description: ""
        };

        obj.cards.push(card);
        stack.insertBefore(createCard(card), p2);
        selectedCard = card;
        openCard();
    } 
    stack.appendChild(p2);

    return stack;
}

const createCard = obj => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.id = obj.id;
    card.draggable = true;
    card.ondragstart = drag;
    card.onclick = openCard;

    const p = document.createElement('p');
    p.classList.add('card-title');
    p.id = obj.id + "-title";
    p.appendChild(document.createTextNode(obj.title));
    card.appendChild(p);
    return card;
}

const loadData = () => {
    data = store.get("kanban");

    if(!data) {
        data = [];
    }

    for(const stack of data) {
        const element = createStack(stack);
        for(const card of stack.cards) {
            const elem = createCard(card);
            element.insertBefore(elem, element.querySelector('.stack-new'));
        } 
        document.getElementById('container').insertBefore(element, document.getElementById('new-stack'));
    }

    archive = store.get("archive");

    if(!archive) {
        archive = [];
    }
}

const getParent = (element, selector) => {
    while(element && !element.matches(selector)) {
        element = element.parentElement;
    }

    return element;
}

const openCard = e => {
    // Load data into popup
    if(!selectedCard) {
        const cards = [].concat.apply([], data.map(stack => stack.cards));
        selectedCard = cards.filter(card => card.id === e.currentTarget.id)[0];
    }

    document.getElementById('title').innerHTML = selectedCard.title;
    
    // Show elements
    document.getElementById("overlay").style.display = "block";
    document.getElementById("popup").style.display = "flex";

    simplemde.value(selectedCard.description);
}

const hideCard = e => {
    if(selectedCard) {
        selectedCard.title = document.getElementById('title').innerText;
        document.getElementById(selectedCard.id + "-title").innerHTML = selectedCard.title;
        selectedCard.description = simplemde.value();
        selectedCard = undefined;

        store.set("kanban", data);
    }

    // Hide elements
    document.getElementById("overlay").style.display = "none";
    document.getElementById("popup").style.display = "none";

    if(e) {
        e.stopPropagation();
    }
}

const openEdit = stack => {
    return e => {
        selectedStack = stack;

        // Load data into popup
        document.getElementById('title-2').value = selectedStack.title;
        document.getElementById('color').value = selectedStack.color || "Gray";
            
        // Show elements
        document.getElementById("overlay-2").style.display = "block";
        document.getElementById("popup-2").style.display = "flex";
    }
}

const hideEdit = e => {
    if(selectedStack) {
        selectedStack.title = document.getElementById('title-2').value;
        document.getElementById(selectedStack.id + "-title").innerHTML = selectedStack.title;
        document.getElementById(selectedStack.id).classList.remove(selectedStack.color);
        selectedStack.color = document.getElementById('color').value;
        document.getElementById(selectedStack.id).classList.add(selectedStack.color);
        selectedStack = undefined;

        store.set("kanban", data);
    }

    // Hide elements
    document.getElementById("overlay-2").style.display = "none";
    document.getElementById("popup-2").style.display = "none";

    if(e) {
        e.stopPropagation();
    }
}

const archiveCard = e => {
    dialogs.confirm("Do you really want to archive this card?", ok => {
        if(ok) {
            for(const stack of data) {
                const index = stack.cards.indexOf(selectedCard);
    
                if(index >= 0) {
                    archive.push(selectedCard);
                    stack.cards.splice(index, 1);
                }
            }
    
            const id = selectedCard.id;
            selectedCard = undefined;
            document.getElementById(id).remove();
            hideCard();
            store.set("kanban", data);
            store.set("archive", archive);
        }
    });
}

const deleteCard = e => {
    dialogs.confirm("Do you really want to delete this card?", ok => {
        if(ok) {
            for(const stack of data) {
                const index = stack.cards.indexOf(selectedCard);
    
                if(index >= 0) {
                    stack.cards.splice(index, 1);
                }
            }
    
            const id = selectedCard.id;
            selectedCard = undefined;
            document.getElementById(id).remove();
            hideCard();
            store.set("kanban", data);
        }
    });
}

const newStack = e => {
    const stack = {
        id: uuidv4(),
        title: "",
        cards: [],
        color: "Gray"
    }
    data.push(stack);
    const element = createStack(stack);
    document.getElementById('container').insertBefore(element, document.getElementById('new-stack'));
    openEdit(stack)();
}

const deleteStack = () => {
    dialogs.confirm("Do you really want to delete this stack?", ok => {
        if(ok) {
            const index = data.indexOf(selectedStack);

            if(index >= 0) {
                data.splice(index, 1);
            }
    
            const id = selectedStack.id;
            selectedStack = undefined;
            document.getElementById(id).remove();
            hideEdit();
            store.set("kanban", data);
        }
    })
   
}

allowDrop = e => {
    e.preventDefault();
}

drag = e => {
    e.dataTransfer.setData("text", e.target.id);
}

drop = e => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text");
    const stack = getParent(e.target, ".stack");
    let pos;

    // Dropped on a card
    if(stack !== e.target) {
        let card = getParent(e.target, ".card");
        if(!card) {
            card = getParent(e.target, ".stack-new");
        }

        if(!card) {
            card = getParent(e.target, ".stack-title");
            card = card.nextSibling;
        }
        stack.insertBefore(document.getElementById(id), card);

        pos = -1;
        let newCard = document.getElementById(id);
        while((newCard = newCard.previousSibling) != null) {
            pos++;
        }
    } else { // dropped on stack
        stack.insertBefore(document.getElementById(id), stack.querySelector('.stack-new'));

        pos = -1;
    }

    const newStack = data.filter(s => s.id === stack.id)[0];
    for(const oldStack of data) {
        const cards = oldStack.cards.filter(c => c.id === id);

        if(cards.length > 0) {
            const card = cards[0];
            oldStack.cards.splice(oldStack.cards.indexOf(card), 1);
            if(pos === -1) {
                newStack.cards.push(card);
            } else {
                newStack.cards.splice(pos, 0, card);
            }
            break;
        }
    }

    store.set("kanban", data);
}

loadData();
const simplemde = new SimpleMDE({ 
    element: document.getElementById("description"),
    autosave: false,
    toolbar: false,
    autoDownloadFontAwesome: false,
    status: false
});