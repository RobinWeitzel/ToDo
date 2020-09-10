TSF.Repository.registerComponent(class NavigationContainer extends TSF.Component {
    constructor() {
        super();

        this.state.display = null;
        this.state.menu = true;
    }

    navigate(e, target) {
        this.state.display = target;
    }

    menuClick() {
        this.state.menu = !this.state.menu;
    }
});