const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

let data;

let selectedCard;

const createStack = obj => {
    const stack = document.createElement('div');
    stack.classList.add('stack');
    stack.ondrop = drop;
    stack.ondragover=allowDrop;

    // Title
    const p = document.createElement('p');
    p.classList.add('stack-title');
    p.appendChild(document.createTextNode(obj.title));
    stack.appendChild(p);

    // Add new card button
    const p2 = document.createElement('p');
    p2.classList.add('stack-new');
    const i = document.createElement('i');
    i.classList.add('fas');
    i.classList.add('fa-plus');
    p2.appendChild(i);
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
    data = localStorage.getItem("kanban");

    if(data) {
        data = JSON.parse(data);
    } else {
        data = [
            {
                title: "ToDo",
                cards: [
                ]
            },
            {
                title: "In progress",
                cards: []
            },
            {
                title: "Done",
                cards: []
            },
        ];
    }

    for(const stack of data) {
        const element = createStack(stack);
        for(const card of stack.cards) {
            const elem = createCard(card);
            element.insertBefore(elem, element.querySelector('.stack-new'));
        } 
        document.getElementById('container').appendChild(element);
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
        selectedCard.title = document.getElementById('title').innerHTML;
        document.getElementById(selectedCard.id + "-title").innerHTML = selectedCard.title;
        selectedCard.description = simplemde.value();
        selectedCard = undefined;

        localStorage.setItem("kanban", JSON.stringify(data));
    }

    // Hide elements
    document.getElementById("overlay").style.display = "none";
    document.getElementById("popup").style.display = "none";

    if(e) {
        e.stopPropagation();
    }
}

const deleteCard = e => {
    if(confirm("Do you really want to delte this card?")) {
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
    }
}

allowDrop = e => {
    e.preventDefault();
}

drag = e => {
    e.dataTransfer.setData("text", e.target.id);
}

drop = e => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text");
    const stack = getParent(e.target, ".stack");

    // Dropped on a card
    if(stack !== e.target) {
        const card = getParent(e.target, ".card");
        stack.insertBefore(document.getElementById(data), card);
    } else { // dropped on stack
        stack.insertBefore(document.getElementById(data), stack.querySelector('.stack-new'));
    }
}

loadData();
const simplemde = new SimpleMDE({ 
    element: document.getElementById("description"),
    autosave: false,
    toolbar: false,
    autoDownloadFontAwesome: false,
    status: false,
    autoSuggest: 
    {
        mode: 'markdown',
        startChars: ['@'],
        listCallback: function(stringToTest)
        {
            return [
                    {
                        text: 'Thomas ',
                        displayText: 'Thomas'
                    },
                    {
                        text: 'Maria ',
                        displayText: 'Maria'
                    },
                    {
                        text: 'Peter ',
                        displayText: 'Peter'
                    }
                ];
        }
    }
});