
            <template>
                <div class="hoper-body">
                    <Mheader></Mheader>
                    <div class="hoper-content">
                        <Mmenu :currentIndex="['0','1','1']"></Mmenu>
                        <div class="hoper-doc">
                          <Doc></Doc>
                        </div>
                    </div>
                    <Mfooter></Mfooter>
                </div>
            </template>

            <script>
            import Mheader from '../../components/Header.vue';
            import Mfooter from '../../components/Footer.vue';
            import Mmenu from '../components/Menu.vue';

            import Doc from '/Users/lyy/Downloads/code/my-project/website/docs/snippets0/JavaScript/BB/B2.md';

            export default {
                components: {
                    Mheader,
                    Mfooter,
                    Mmenu,
                    Doc
                }
            };

            </script>
          