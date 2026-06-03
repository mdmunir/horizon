<script setup>
defineOptions({
    layout: 'main',
});
</script>
<template>
    <div class="bg-grey-lighten-3">
        <v-container class="d-flex" style="min-height:100vh">
            <v-row class="d-flex align-center">
                <v-col class="d-flex align-center justify-center pa-4">
                    <v-card class="align-center" style="min-width:320px">
                        <v-card-text>
                            <RouterLink to="/"><v-img height="40" :src="appLogo"></v-img></RouterLink>
                            <h4 class="text-center text-h6">Not Found</h4>
                        </v-card-text>
                        <v-card-text>
                            <h2 class="text-center">Page not found</h2>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>
