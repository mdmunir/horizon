<script setup>
import { darkMode, drawerState } from '@/composables/global';
import Main from './Main.vue';
import SideMenu from './SideMenu.vue';
import menus from './menus';

</script>
<template>
    <Main>
        <v-navigation-drawer v-model="drawerState" fixed app>
            <v-list>
                <v-list-item :prepend-avatar="appLogo" subtitle="Horison" title="Dee" to="/"></v-list-item>
            </v-list>
            <v-divider></v-divider>
            <SideMenu :menus="menus" />
        </v-navigation-drawer>
        <v-app-bar fixed app>
            <v-app-bar-nav-icon @click.stop="drawerState = !drawerState"/>
            <LocationInfo></LocationInfo>
            <PrayerInfo></PrayerInfo>
            <v-spacer></v-spacer>
            <v-btn @click.stop="darkMode = !darkMode"
                :icon="darkMode ? 'mdi-brightness-4' : 'mdi-white-balance-sunny'"></v-btn>
        </v-app-bar>
        <v-main>
            <slot></slot>
        </v-main>
        <v-footer :absolute="false" app>
            <span><a href="https://github.com/mdmunir">@mdmunir</a> &copy; {{ new Date().getFullYear() }}</span>
        </v-footer>
    </Main>
</template>