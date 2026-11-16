      if (!checkExistingAuth()) {
        if ($('login')) $('login').hidden = false;
        if ($('loginUser')) $('loginUser').focus();
      }
    })();