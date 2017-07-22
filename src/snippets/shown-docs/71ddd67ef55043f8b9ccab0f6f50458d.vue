
            <template>
                <div class="hoper-body">

                    <div class="hoper-content">
                        <Mmenu :currentIndex="['2','0']"></Mmenu>
                        <div class="hoper-doc">
                          <img v-bind:src="src">
                        </div>
                    </div>

                </div>
            </template>

            <script>
            import Mheader from '../../components/Header.vue';
            import Mfooter from '../../components/Footer.vue';
            import Mmenu from '../components/Menu.vue';

            export default {
                components: {
                    Mheader,
                    Mfooter,
                    Mmenu
                },
                data() {
                  return {
                    src: './loaded-doc/assets/markdown-img-paste-20170721095758212.png'
                  }
                }
            };

            </script>
          