'use strict';

module.exports = dualspace => {
  const getMessages = function getMessages() {
    let count = 0;

    if (window.location.pathname.includes('messaging')) {
      count = document.querySelectorAll('.msg-conversation-card__unread-count').length;
    } else {
      const element = document.querySelector('.nav-item--messaging .nav-item__badge-count');

      if (element) {
        count = parseInt(element.innerHTML, 10);
      }
    }

    // set dualspace badge
    dualspace.setBadge(count);
  };

  // check for new messages every second and update dualspace badge
  dualspace.loop(getMessages);

  // let { ipcRenderer } = require('electron')
  // ipcRenderer.on('serviceProvider', (e, data) => {
  //   console.log(data)
  // })
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpbmtlZGluL3dlYnZpZXcuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIkZyYW56IiwiZ2V0TWVzc2FnZXMiLCJjb3VudCIsIndpbmRvdyIsImxvY2F0aW9uIiwicGF0aG5hbWUiLCJpbmNsdWRlcyIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvckFsbCIsImxlbmd0aCIsImVsZW1lbnQiLCJxdWVyeVNlbGVjdG9yIiwicGFyc2VJbnQiLCJpbm5lckhUTUwiLCJzZXRCYWRnZSIsImxvb3AiXSwibWFwcGluZ3MiOiI7O0FBQUFBLE9BQU9DLE9BQVAsR0FBa0JDLEtBQUQsSUFBVztBQUMxQixRQUFNQyxjQUFjLFNBQVNBLFdBQVQsR0FBdUI7QUFDekMsUUFBSUMsUUFBUSxDQUFaOztBQUVBLFFBQUlDLE9BQU9DLFFBQVAsQ0FBZ0JDLFFBQWhCLENBQXlCQyxRQUF6QixDQUFrQyxXQUFsQyxDQUFKLEVBQW9EO0FBQ2xESixjQUFRSyxTQUFTQyxnQkFBVCxDQUEwQixzQ0FBMUIsRUFBa0VDLE1BQTFFO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsWUFBTUMsVUFBVUgsU0FBU0ksYUFBVCxDQUF1Qiw2Q0FBdkIsQ0FBaEI7O0FBRUEsVUFBSUQsT0FBSixFQUFhO0FBQ1hSLGdCQUFRVSxTQUFTRixRQUFRRyxTQUFqQixFQUE0QixFQUE1QixDQUFSO0FBQ0Q7QUFDRjs7QUFFRDtBQUNBYixVQUFNYyxRQUFOLENBQWVaLEtBQWY7QUFDRCxHQWZEOztBQWlCQTtBQUNBRixRQUFNZSxJQUFOLENBQVdkLFdBQVg7QUFDRCxDQXBCRCIsImZpbGUiOiJsaW5rZWRpbi93ZWJ2aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSAoRnJhbnopID0+IHtcbiAgY29uc3QgZ2V0TWVzc2FnZXMgPSBmdW5jdGlvbiBnZXRNZXNzYWdlcygpIHtcbiAgICBsZXQgY291bnQgPSAwO1xuXG4gICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5pbmNsdWRlcygnbWVzc2FnaW5nJykpIHtcbiAgICAgIGNvdW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm1zZy1jb252ZXJzYXRpb24tY2FyZF9fdW5yZWFkLWNvdW50JykubGVuZ3RoO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm5hdi1pdGVtLS1tZXNzYWdpbmcgLm5hdi1pdGVtX19iYWRnZS1jb3VudCcpO1xuXG4gICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICBjb3VudCA9IHBhcnNlSW50KGVsZW1lbnQuaW5uZXJIVE1MLCAxMCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gc2V0IEZyYW56IGJhZGdlXG4gICAgRnJhbnouc2V0QmFkZ2UoY291bnQpO1xuICB9O1xuXG4gIC8vIGNoZWNrIGZvciBuZXcgbWVzc2FnZXMgZXZlcnkgc2Vjb25kIGFuZCB1cGRhdGUgRnJhbnogYmFkZ2VcbiAgRnJhbnoubG9vcChnZXRNZXNzYWdlcyk7XG59O1xuIl19