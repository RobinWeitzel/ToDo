const Store = require('electron-store');
const Dialogs = require('dialogs');

const store = new Store();
const dialogs = Dialogs();

let data;

let selectedTab;

const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

const createTab = obj => {
    const tab = document.createElement('div');
    tab.id = obj.id;
    tab.classList.add('tab');
    tab.appendChild(document.createTextNode(obj.title));
    tab.onclick = loadTab(obj);
    const i = document.createElement('i');
    i.classList.add('fas');
    i.classList.add('fa-trash-alt');
    i.onclick = deleteTab(obj);
    tab.appendChild(i);
    return tab;
}

const load = () => {
    data = store.get("notes");

    if(!data) {
        data = [
        ];
    }

    for(const tab of data) {
        document.getElementById('tabs').insertBefore(createTab(tab), document.getElementById('new-tab'));
    }
}

const loadTab = tab => {
    return e => {
        selectedTab = tab;
        document.getElementById('notes').style.display = 'block';
        simplemde.value(tab.content);

        document.querySelectorAll('.tab').forEach(t => {
            t.classList.remove('selected');
        });

        if(e) {
            e.currentTarget.classList.add('selected');
        }
    }
}

const newTab = () => {
    const title = dialogs.prompt("Enter name of the note", title => {
        if(title) {
            const tab = {
                id: uuidv4(),
                title: title,
                content: ""
            };
    
            data.push(tab);
            const t = createTab(tab);
    
            document.getElementById('tabs').insertBefore(t, document.getElementById('new-tab'));
            loadTab(tab)();
            t.classList.add('selected');
    
            store.set("notes", data);
        }
    });
}

const deleteTab = tab => {
    return e => {
        dialogs.confirm("Do you really want to delete this note?", ok => {
            if(ok) {
                const index = data.indexOf(tab);
                data.splice(index, 1);
                store.set("notes", data);
                document.getElementById(tab.id).remove();
                document.getElementById('notes').style.display = 'none';
            }
        });
        e.stopPropagation();
    }
}

load();

const simplemde = new SimpleMDE({ 
    element: document.getElementById("text"),
    autosave: false,
    autoDownloadFontAwesome: false,
    status: false
});

simplemde.codemirror.on("change", function(){
	if(selectedTab) {
        selectedTab.content = simplemde.value();
        store.set("notes",data);
    }
});