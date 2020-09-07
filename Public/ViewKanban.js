const Store = require('electron-store');

const store = new Store();
/*
const store = {
    get: () => {
        
    },
    set: () => {

    }
}*/

const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

TSF.Repository.registerComponent(class ViewKanban extends TSF.Component {
    constructor() {
        super();

        this.state.dragEvent = null;
        this.state.menu = true;
        this.state.selected = null;
        this.state.edit = null;
        this.state.largePanel = false;
        this.state.newCardName = "";
        this.state.search;

        this.state.dialog = null;

        this.state.projects = store.get("new-kanban") || [];
        if(this.state.projects.length > 0) {
            this.state.open = this.state.projects[0];
        }
        this.state.archive = store.get("new-archive") || [];
    }

    showDialog(type, message, callback) {
        this.state.dialog = {
            type,
            message,
            callback
        }

        document.getElementById("dialog-input").focus();
    }

    hideDialog(e, message) {
        let result = null;
        if(this.state.dialog.type === "prompt" && message === "ok") {
            result = document.getElementById('dialog-input').value;
        } else {
            result = message === "ok";
        }
        this.state.dialog.callback(result);

        document.getElementById('dialog-input').value = "";
        this.state.dialog = null;
    }

    save() {
        store.set("new-kanban", this.state.projects);
    }

    navigate(e, target) {
        this.state.open = target;
    }

    drag(e, item) {
        e.dataTransfer.setData("text", item.id);
    }

    allowDrop(ev) {
        ev.preventDefault();
    }

    drop(ev, task) {
        ev.preventDefault();

        const offsets = Array.from(ev.currentTarget.querySelector('.task-item-container').children).map(i => i.offsetTop + i.offsetHeight);
        const posY = ev.clientY;

        let pos = offsets.findIndex(o => o > posY);

        let item;

        for(const task of this.state.open.tasks) {
            const index = task.items.findIndex(i => i.id === ev.dataTransfer.getData("text"));

            if(index >= 0) {
                item = task.items.splice(index, 1)[0]; 
                break;
            }
        }
        
        if(pos === -1) {
            pos = offsets.length;
        }

        task.items.splice(pos, 0, item);
        
        this.state.dragEvent = null;
        this.state._domChange['open']();
        this.save();
    }

    newProject() {
        this.showDialog("prompt", "Enter the project name:", name => {
            if (name) {
                const project = {
                    id: uuidv4(),
                    name: name,
                    tasks: []
                };
    
                this.state.projects.push(project);
                this.state.open = project;
                this.save();
            }
        });
    }

    menuClick() {
        this.state.menu = !this.state.menu;
    }

    newItem(e, task) {
        const item = {
            id: uuidv4(),
            title: "",
            description: "",
            date: new Date().toISOString()
        };

        task.items.push(item);
        this.state.selected = item;
        this.state._domChange['open']();
        this.save();

        document.getElementById("title-input").focus();
    }

    selectItem(e, item) {
        this.state.selected = item;
        simplemde.value(item.description);
    }

    deselectItem(e) {
        this.state.selected.title = document.getElementById('title-input').value;
        this.state.selected.description = simplemde.value();

        this.state.selected = null;
        this.state.largePanel = false;

        this.state._domChange['open']();

        this.save();
    }

    resizePanel(e) {
        this.state.largePanel = !this.state.largePanel;
    }

    archiveItem(e) {
        this.state.archive.push(this.state.selected);
        this.state.open.tasks.forEach(task => {
            const index = task.items.findIndex(i => i.id === this.state.selected.id);
            if(index >= 0) {
                const item = task.items.splice(index, 1);
                this.state.archive.push(item);
            }
        });

        this.state.selected = null;
        this.state.largePanel = false;

        this.state._domChange['open']();
        this.save();
        store.set("new-archive", this.state.archive);
    }

    renderDate(date) {
        if(date && typeof date === "string") {
            date = new Date(date);
        }

        const dateTimeFormat = new Intl.DateTimeFormat('de-DE', { year: 'numeric', month: 'short', day: '2-digit' });
        return dateTimeFormat.format(date); 
    }

    editProject(e, project) {
        this.state.edit = project;
    }

    deselectProject(e) {
        this.state.edit.name = document.getElementById('project-name').value;

        if(this.state.open.id === this.state.edit.id) {
            this.state._domChange['open']();
        }

        this.state.edit = null;
    }

    deleteProject(e) {
        this.showDialog("comfirm", "Do you really want to delete this project?", ok => {
            if(ok) {
                const index = this.state.projects.findIndex(p => p.id === this.state.edit.id);
                this.state.projects.splice(index, 1);

                if(this.state.open.id === this.state.edit.id) {
                    this.state.open = null;
                }

                this.state.edit = null;
                this.save();
            }
        });
    }

    newCard(e) {
        this.state.edit.tasks.push({
            id: uuidv4(),
            name: this.state.newCardName,
            items: []
        });

        this.state.newCardName = "";

        this.state._domChange['open']();
        this.state._domChange['edit']();
        this.save();
    }

    deleteTask(e, task) {
        this.showDialog("comfirm", "Do you really want to delete this card?", ok => {
            if(ok) {    
                const index = this.state.edit.tasks.findIndex(t => t.id === task.id);

                this.state.edit.tasks.splice(index, 1);

                this.state._domChange['edit']();

                if(this.state.open.id === this.state.edit.id) {
                    this.state._domChange['open']();
                }
                this.save();
            }
        });
    }
});