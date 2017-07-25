
              <template>
                  <div class="hoper-body">

                      <div class="hoper-content">
                          <Mmenu :currentIndex="['3','0']"></Mmenu>
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

              import Doc from './../../../../docs/blog/工作总结/2014.md';

              export default {
                  components: {
                      Mheader,
                      Mfooter,
                      Mmenu,
                      Doc
                  }
              };

              </script>
            