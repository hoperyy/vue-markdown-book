
              <template>
                  <div class="hoper-body">

                      <div class="hoper-content">
                          <Mmenu :currentIndex="['1','0','0']"></Mmenu>
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

              import Doc from './loaded-doc/demo/assets/markdown-img-paste-20170724185101208.png.md';

              export default {
                  components: {
                      Mheader,
                      Mfooter,
                      Mmenu,
                      Doc
                  }
              };

              </script>
            