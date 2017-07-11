module.exports = {
  plugins: [
    require('autoprefixer')({
        browsers: [
            "Android >= 4",
            "iOS >= 5"
        ],
        cascade: true
    })
  ]
}
