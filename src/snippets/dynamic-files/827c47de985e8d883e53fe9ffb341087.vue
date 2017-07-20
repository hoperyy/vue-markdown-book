
              <template>
                  <div class="hoper-body">

                      <div class="hoper-content">
                          <Mmenu :currentIndex="['1']"></Mmenu>
                          <div class="hoper-doc">
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
                      Mmenu,
                  }
              };

              </script>
            