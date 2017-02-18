;(function () {
  $('a.component-segment-label').on('click',function () {
    var segmentContent = $(this).closest('.ui.segment').find('>.list-components');
    segmentContent.slideToggle();
  });
})();