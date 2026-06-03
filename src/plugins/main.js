import { vMaska } from "maska/vue";
import { useRoute, useRouter } from "vue-router";

export default {
    install(app) {
        app.directive('maska', vMaska);
        app.component("RouterLink", {
            useLink(props) {
                const href = props.to.value;
                const current = useRoute().path;
                const router = useRouter();
                return {
                    route: computed(() => ({ href })),
                    isActive: computed(() => current.startsWith(href || '')),
                    isExactActive: computed(() => href === current),
                    navigate(e){
                        if (e.shiftKey || e.metaKey || e.ctrlKey) {
                            return;
                        }
                        e.preventDefault();
                        router.push(href);
                    }
                }
            },
        });
    },
}