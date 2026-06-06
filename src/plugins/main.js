import { vMaska } from "maska/vue";

export default {
    install(app) {
        app.directive('maska', vMaska);
    },
}