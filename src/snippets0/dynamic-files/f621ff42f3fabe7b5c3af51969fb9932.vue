
            <template>
                <div>
                    <Mheader></Mheader>
                    <Mmenu :currentIndex="['0','0','1']"></Mmenu>
                    <Snippet></Snippet>
                    <Mfooter></Mfooter>
                </div>
            </template>

            <script>
            import Mheader from '../../components/Header.vue';
            import Mfooter from '../../components/Footer.vue';
            import Mmenu from '../components/Menu.vue';

            import Snippet from '/Users/lyy/Downloads/code/my-project/website/docs/snippets0/JavaScript/AA/A2.md';

            export default {
                components: {
                    Mheader,
                    Mfooter,
                    Mmenu,
                    Snippet
                }
            };

            </script>
          