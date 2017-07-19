
            <template>
                <div class="hoper-body">

                    <div class="hoper-content">
                        <Mmenu :currentIndex="['0','0','1']"></Mmenu>
                        <div class="hoper-doc">
                          <Doc></Doc>
                        </div>
                    </div>
                    
                </div>
            </template>

            <script>
            import Mheader from '../../components/Header.vue';
            import Mfooter from '../../components/Footer.vue';
            import Mmenu from '../components/Menu.vue';

            import Doc from '/Users/lyy/Downloads/code/my-project/website/docs/snippets/JavaScript/AA/A2.md';

            export default {
                components: {
                    Mheader,
                    Mfooter,
                    Mmenu,
                    Doc
                }
            };

            </script>
          