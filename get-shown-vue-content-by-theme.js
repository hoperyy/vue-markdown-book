module.exports = {

    'default': (config) => {
        const isDirectory = config.isDirectory;
        const isFile = config.isFile;
        const fileIndex = config.fileIndex;

        const loadedDocPath = config.loadedDocPath;

        if (isDirectory) {
            return `
              <template>
                  <div class="theme-default-body">
                      <div class="theme-default-content">

                          <Mmenu :currentIndex="${fileIndex}"></Mmenu>
                          <div class="common-theme-markdown-doc theme-default-markdown-doc">
                          </div>

                      </div>
                  </div>
              </template>

              <script>
              import Mheader from '../components/common/Header.vue';
              import Mfooter from '../components/common/Footer.vue';
              import Mmenu from '../components/Menu.vue';

              export default {
                  components: {
                      Mheader,
                      Mfooter,
                      Mmenu,
                  }
              };

              </script>
            `;
        }

        if (isFile) {
            return `
                <template>
                    <div class="theme-default-body">
                        <div class="theme-default-content">

                            <Mmenu :currentIndex="${fileIndex}"></Mmenu>
                            <div class="common-theme-markdown-doc theme-default-markdown-doc">
                              <Doc></Doc>
                            </div>
                        </div>
                    </div>
                </template>

                <script>
                import Mheader from '../components/common/Header.vue';
                import Mfooter from '../components/common/Footer.vue';
                import Mmenu from '../components/Menu.vue';

                import Doc from '${loadedDocPath}';

                export default {
                    components: {
                        Mheader,
                        Mfooter,
                        Mmenu,
                        Doc
                    }
                };

                </script>
              `;
        }
    }

};
