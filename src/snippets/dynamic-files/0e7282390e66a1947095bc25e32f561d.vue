
            <template>
                <div class="hoper-body">

                    <div class="hoper-content">
                        <Mmenu :currentIndex="['1','1']"></Mmenu>
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

            import Doc from '/Users/lyy/Downloads/code/my-project/website/docs/snippets/JavaScript0/基础知识0.md';

            export default {
                components: {
                    Mheader,
                    Mfooter,
                    Mmenu,
                    Doc
                }
            };

            </script>
          