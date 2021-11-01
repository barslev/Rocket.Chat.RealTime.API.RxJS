import { WebSocket, Server } from "mock-socket";
import { RealTimeAPI } from "../src";
import { SHA256 } from "crypto-js";
import { WebSocketSubject } from "rxjs/webSocket";

describe("RealTimeAPI tests", () => {
  const url = "ws://localhost:8080/";
  let mockServer: Server;

  beforeEach(() => {
    mockServer = new Server(url);
  });

  afterEach(() => {
    let closer = {
      code: 0,
      reason: "disconnected",
      wasClean: true
    };
    mockServer.close(closer);
  });

  it("can connect", done => {
    const realtimeAPI$ = new RealTimeAPI(url); // Connecting to websocket url.

    realtimeAPI$.subscribe();

    mockServer.on("connection", (socket: WebSocket) => {
      expect(socket.url).toEqual(url); // Expecting websocket url.
      done();
    });
  });

  it("can send pong for every ping", done => {
    const realtimeAPI$ = new RealTimeAPI(url);

    realtimeAPI$.keepAlive().subscribe(); // Should send pong to every ping message.

    mockServer.on("connection", (socket: WebSocket) => {
      expect(socket.url).toEqual(url); // Expecting websocket url.

      socket.send(JSON.stringify({ msg: "ping" })); // Sending "ping" message.
      socket.on("message", data => {
        expect(data).toEqual(JSON.stringify({ msg: "pong" })); // Expecting to receive "pong" message.
        done();
      });
    });
  });

  it("can send connection request message", done => {
    const realtimeAPI$ = new RealTimeAPI(url);

    realtimeAPI$.connectToServer().subscribe(); // Should send pong to every ping message.

    mockServer.on("connection", (socket: WebSocket) => {
      expect(socket.url).toEqual(url); // Expecting websocket url.

      socket.on("message", data => {
        expect(data).toEqual(
          JSON.stringify({
            msg: "connect",
            version: "1",
            support: ["1", "pre2", "pre1"]
          })
        ); // Expecting ddp connection message.
        done();
      });
    });
  });

  describe("login methods", () => {
    it("can send login request with username and password", done => {
      const realtimeAPI$ = new RealTimeAPI(url);
      const username = "username";
      const password = "password";
      realtimeAPI$.login(username, password).subscribe(); // Should send pong to every ping message.

      mockServer.on("connection", (socket: WebSocket) => {
        expect(socket.url).toEqual(url); // Expecting websocket url.

        socket.on("message", data => {
          if (typeof data !== "string") {
            return;
          }
          let message = JSON.parse(data);

          expect(message).toHaveProperty("id"); // Expecting to have "id" property in message.

          expect(message).toHaveProperty("msg"); // Expecting to have "msg" property in message.
          expect(message.msg).toEqual("method"); // Expecting "msg" to be "method" in message.

          expect(message).toHaveProperty("method"); // Expecting to have "method" property in message.
          expect(message.method).toEqual("login"); // Expecting "method" to be "login" in message.

          expect(message).toHaveProperty("params"); // Expecting to have "params" property in message.

          expect(message.params).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                user: { username },
                password: {
                  digest: SHA256(password).toString(),
                  algorithm: "sha-256"
                }
              })
            ])
          ); //Expecting params to be Array of Object { user: {username: "username"}, password: { algorithm: "sha-256", digest: "..."} }

          done();
        });
      });
    });

    it("can send login request with email and password", done => {
      const realtimeAPI$ = new RealTimeAPI(url);
      const email = "username@email.com";
      const password = "password";
      realtimeAPI$.login(email, password).subscribe(); // Should send pong to every ping message.
      mockServer.on("connection", (socket: WebSocket) => {
        expect(socket.url).toEqual(url); // Expecting websocket url.

        socket.on("message", data => {
          if (typeof data !== "string") {
            return;
          }
          let message = JSON.parse(data);

          expect(message).toHaveProperty("id"); // Expecting to have "id" property in message.

          expect(message).toHaveProperty("msg"); // Expecting to have "msg" property in message.
          expect(message.msg).toEqual("method"); // Expecting "msg" to be "method" in message.

          expect(message).toHaveProperty("method"); // Expecting to have "method" property in message.
          expect(message.method).toEqual("login"); // Expecting "method" to be "login" in message.

          expect(message).toHaveProperty("params"); // Expecting to have "params" property in message.

          expect(message.params).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                user: { email },
                password: {
                  digest: SHA256(password).toString(),
                  algorithm: "sha-256"
                }
              })
            ])
          ); //Expecting params to be Array of Object { user: {email: "username@email.com"}, password: { algorithm: "sha-256", digest: "..."} }

          done();
        });
      });
    });

    it("can send login request with auth token", done => {
      const realtimeAPI$ = new RealTimeAPI(url);
      const token = "token";
      realtimeAPI$.loginWithAuthToken(token).subscribe(); // Should send pong to every ping message.
      mockServer.on("connection", (socket: WebSocket) => {
        expect(socket.url).toEqual(url); // Expecting websocket url.

        socket.on("message", data => {
          if (typeof data !== "string") {
            return;
          }
          let message = JSON.parse(data);

          expect(message).toHaveProperty("id"); // Expecting to have "id" property in message.

          expect(message).toHaveProperty("msg"); // Expecting to have "msg" property in message.
          expect(message.msg).toEqual("method"); // Expecting "msg" to be "method" in message.

          expect(message).toHaveProperty("method"); // Expecting to have "method" property in message.
          expect(message.method).toEqual("login"); // Expecting "method" to be "login" in message.

          expect(message).toHaveProperty("params"); // Expecting to have "params" property in message.

          expect(message.params).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                resume: token
              })
            ])
          ); //Expecting params to be Array of Object { resume: "token" }

          done();
        });
      });
    });

    it("can send login request with oauth tokens", done => {
      const realtimeAPI$ = new RealTimeAPI(url);
      const credentialToken = "credentialToken";
      const credentialSecret = "credentialSecret";

      realtimeAPI$
        .loginWithOAuth(credentialToken, credentialSecret)
        .subscribe(); // Should send pong to every ping message.
      mockServer.on("connection", (socket: WebSocket) => {
        expect(socket.url).toEqual(url); // Expecting websocket url.

        socket.on("message", data => {
          if (typeof data != "string") {
            return;
          }
          let message = JSON.parse(data);

          expect(message).toHaveProperty("id"); // Expecting to have "id" property in message.

          expect(message).toHaveProperty("msg"); // Expecting to have "msg" property in message.
          expect(message.msg).toEqual("method"); // Expecting "msg" to be "method" in message.

          expect(message).toHaveProperty("method"); // Expecting to have "method" property in message.
          expect(message.method).toEqual("login"); // Expecting "method" to be "login" in message.

          expect(message).toHaveProperty("params"); // Expecting to have "params" property in message.

          expect(message.params).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                oauth: {
                  credentialToken,
                  credentialSecret
                }
              })
            ])
          ); //Expecting params to be Array of Object { oauth: {credentialSecret: "credentialSecret", credentialToken: "credentialToken"} }

          done();
        });
      });
    });

    it("can get response to successful login request", done => {
      const realtimeAPI$ = new RealTimeAPI(url);
      const username = "username";
      const password = "password";
      const addedMessageId = "some-id";
      let resultId: any;

      realtimeAPI$.subscribe(); // Should send pong to every ping message.

      mockServer.on("connection", (socket: WebSocket) => {
        expect(socket.url).toEqual(url); // Expecting websocket url.

        socket.on("message", data => {
          if (typeof data != "string") {
            return;
          }
          let message = JSON.parse(data);

          expect(message).toHaveProperty("id"); // Expecting to have "id" property in message.

          expect(message).toHaveProperty("msg"); // Expecting to have "msg" property in message.
          expect(message.msg).toEqual("method"); // Expecting "msg" to be "method" in message.

          expect(message).toHaveProperty("method"); // Expecting to have "method" property in message.
          expect(message.method).toEqual("login"); // Expecting "method" to be "login" in message.

          expect(message).toHaveProperty("params"); // Expecting to have "params" property in message.

          expect(message.params).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                user: { username },
                password: {
                  digest: SHA256(password).toString(),
                  algorithm: "sha-256"
                }
              })
            ])
          ); //Expecting params to be Array of Object { user: {username: "username"}, password: { algorithm: "sha-256", digest: "..."} }
          const addedMessage = { msg: "added", id: addedMessageId };
          resultId = message.id;
          const resultMessage = {
            msg: "result",
            id: resultId,
            result: { id: addedMessageId }
          };

          socket.send(JSON.stringify(addedMessage));
          socket.send(JSON.stringify(resultMessage));
        });

        realtimeAPI$.login(username, password).subscribe(message => {
          expect(message).toHaveProperty("msg");
          if (message.msg === "added") {
            expect(message).toHaveProperty("id");
            expect(message.id).toEqual(addedMessageId);
          }

          if (message.msg === "result") {
            expect(message).toHaveProperty("id");
            expect(message.id).toEqual(resultId);
            expect(message).toHaveProperty("result");
            expect(message.result).toHaveProperty("id");
            expect(message.result.id).toEqual(addedMessageId);

            done();
          }
        }); // Should send pong to every ping message.
      });
    });

    it("can get response to unsuccessful login request", done => {
      const realtimeAPI$ = new RealTimeAPI(url);
      const username = "username";
      const password = "password";
      const error = {
        error: 403,
        reason: "User not found",
        message: "User not found [403]",
        errorType: "UserNotFoundError"
      };
      let resultId: any;

      realtimeAPI$.subscribe(); // Should send pong to every ping message.

      mockServer.on("connection", (socket: WebSocket) => {
        expect(socket.url).toEqual(url); // Expecting websocket url.

        socket.on("message", data => {
          if (typeof data != "string") {
            return;
          }
          let message = JSON.parse(data);

          expect(message).toHaveProperty("id"); // Expecting to have "id" property in message.

          expect(message).toHaveProperty("msg"); // Expecting to have "msg" property in message.
          expect(message.msg).toEqual("method"); // Expecting "msg" to be "method" in message.

          expect(message).toHaveProperty("method"); // Expecting to have "method" property in message.
          expect(message.method).toEqual("login"); // Expecting "method" to be "login" in message.

          expect(message).toHaveProperty("params"); // Expecting to have "params" property in message.

          expect(message.params).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                user: { username },
                password: {
                  digest: SHA256(password).toString(),
                  algorithm: "sha-256"
                }
              })
            ])
          ); //Expecting params to be Array of Object { user: {username: "username"}, password: { algorithm: "sha-256", digest: "..."} }
          resultId = message.id;
          const resultMessage = { msg: "result", id: resultId, error: error };

          socket.send(JSON.stringify(resultMessage));
        });

        realtimeAPI$.login(username, password).subscribe(message => {
          expect(message).toHaveProperty("msg");
          expect(message.msg).toEqual("result");
          expect(message).toHaveProperty("id");
          expect(message.id).toEqual(resultId);
          expect(message).toHaveProperty("error");
          expect(message.error).toEqual(error);
          done();
        });
      });
    });
  });

  it("can call api methods", done => {
    const realtimeAPI$ = new RealTimeAPI(url);

    const method = "testMethod";
    const params = ["example-parameter"];

    realtimeAPI$.callMethod(method, ...params).subscribe();

    mockServer.on("connection", (socket: WebSocket) => {
      expect(socket.url).toEqual(url); // Expecting websocket url.

      socket.on("message", data => {
        if (typeof data != "string") {
          return;
        }
        let message = JSON.parse(data);

        expect(message).toHaveProperty("id"); // Expecting to have "id" property in message.

        expect(message).toHaveProperty("msg"); // Expecting to have "msg" property in message.
        expect(message.msg).toEqual("method"); // Expecting "msg" to be "method" in message.

        expect(message).toHaveProperty("method"); // Expecting to have "method" property in message.
        expect(message.method).toEqual(method); // Expecting "method" to be "testMethod" in message.

        expect(message).toHaveProperty("params"); // Expecting to have "params" property in message.

        expect(message.params).toEqual(params); //Expecting params to be [ "example-parameter" ].

        done();
      });
    });
  });

  it("can disconnect", done => {
    const realtimeAPI$ = new RealTimeAPI(url);

    realtimeAPI$.keepAlive().subscribe();

    mockServer.on("connection", (socket: WebSocket) => {
      expect(socket.url).toEqual(url); // Expecting websocket url. Connection Successful.

      mockServer.on("close", (socket: WebSocket) => {
        // Setting up Close Call listener
        expect(socket.url).toEqual(url); // Expecting websocket url. Connection Closed.
        done();
      });

      realtimeAPI$.disconnect(); // Closing the connection.
    });
  });

  it("can get the current webSocket observable", done => {
    const realtimeAPI$ = new RealTimeAPI(url);
    expect(realtimeAPI$.getObservable()).toBeInstanceOf(WebSocketSubject);
    expect(realtimeAPI$.getObservable()).toHaveProperty("_config");
    expect(realtimeAPI$.getObservable()["_config"]).toHaveProperty("url");
    expect(realtimeAPI$.getObservable()["_config"].url).toEqual(url);
    done();
  });

  it("can filter messages by id", done => {
    const realtimeAPI$ = new RealTimeAPI(url);
    const id = "1";
    const other_id = "2";

    realtimeAPI$.getObservableFilteredByID(id).subscribe(message => {
      expect(message.id).toEqual(id); // Expecting id to be 1
      done();
    });

    mockServer.on("connection", (socket: WebSocket) => {
      expect(socket.url).toEqual(url); // Expecting websocket url. Connection Successful.

      socket.send(
        JSON.stringify({
          id: other_id // Sending other id, which is expected to be filtered.
        })
      );

      socket.send(
        JSON.stringify({
          id: id // Sending id, which is expected.
        })
      );
    });
  });

  it("can filter messages by message type (msg)", done => {
    const realtimeAPI$ = new RealTimeAPI(url);
    const type = "type_1";
    const other_type = "type_2";

    realtimeAPI$.getObservableFilteredByMessageType(type).subscribe(message => {
      expect(message.msg).toEqual(type); // Expecting id to be type_1
      done();
    });

    mockServer.on("connection", (socket: WebSocket) => {
      expect(socket.url).toEqual(url); // Expecting websocket url. Connection Successful.

      socket.send(
        JSON.stringify({
          msg: other_type // Sending other type, which is expected to be filtered.
        })
      );

      socket.send(
        JSON.stringify({
          msg: type // Sending type, which is expected.
        })
      );
    });
  });

  describe("getSubscription method", () => {
    it("can send subscription message to a channel", done => {
      const realtimeAPI$ = new RealTimeAPI(url);
      const streamName = "example-stream-name";
      const streamParam = "stream-parameter";
      const addEvent = true;

      realtimeAPI$
        .getSubscription(streamName, streamParam, addEvent)
        .subscribe();

      mockServer.on("connection", (socket: WebSocket) => {
        expect(socket.url).toEqual(url); // Expecting websocket url. Connection Successful.
        socket.on("message", data => {
          if (typeof data !== "string") {
            return;
          }
          let message = JSON.parse(data);

          expect(message).toHaveProperty("id"); // Expecting to have "id" property in message.

          expect(message).toHaveProperty("msg"); // Expecting to have "msg" property in message.
          expect(message.msg).toEqual("sub"); // Expecting "msg" to be "sub" in message.

          expect(message).toHaveProperty("name"); // Expecting to have "method" property in message.
          expect(message.name).toEqual(streamName); // Expecting "method" to be streamName in message.

          expect(message).toHaveProperty("params"); // Expecting to have "params" property in message.

          expect(message.params).toEqual(
            expect.arrayContaining([streamParam, addEvent])
          ); //Expecting params to be Array [streamParam, addEvent]

          done();
        });
      });
    });

    it("can send unsubscription message to a channel", done => {
      const realtimeAPI$ = new RealTimeAPI(url);
      const streamName = "example-stream-name";
      const streamParam = "stream-parameter";
      const addEvent = true;

      let channelSubscription$ = realtimeAPI$
        .getSubscription(streamName, streamParam, addEvent)
        .subscribe();

      mockServer.on("connection", (socket: WebSocket) => {
        expect(socket.url).toEqual(url); // Expecting websocket url. Connection Successful.

        channelSubscription$.unsubscribe();

        let messageId: any;

        socket.on("message", data => {
          if (typeof data !== "string") {
            return;
          }
          let message = JSON.parse(data);

          if (message.msg === "sub") {
            messageId = message.id; //Set Message Id On Subscription
          }

          if (message.msg === "unsub") {
            expect(message).toHaveProperty("id"); // Expecting to have "id" property in message.
            expect(message.id).toEqual(messageId); // Expecting "id" to be messageId from sub message.

            expect(message).toHaveProperty("msg"); // Expecting to have "msg" property in message.
            expect(message.msg).toEqual("unsub"); // Expecting "msg" to be "unsub" in message.

            done();
          }
        });
      });
    });

    it("can get messages from subscription", done => {
      const realtimeAPI$ = new RealTimeAPI(url);
      const streamName = "example-stream-name";
      const streamParam = "stream-parameter";
      const addEvent = true;

      const streamMessage = {
        collection: streamName,
        fields: {
          eventName: streamParam
        }
      };

      const otherStreamMessage = {
        collection: "other-stream-name",
        fields: {
          eventName: streamParam
        }
      };

      realtimeAPI$
        .getSubscription(streamName, streamParam, addEvent)
        .subscribe(message => {
          expect(message).toEqual(streamMessage); // Expecting "messages" to be the streamMessage in message.
          done();
        });

      mockServer.on("connection", (socket: WebSocket) => {
        expect(socket.url).toEqual(url); // Expecting websocket url. Connection Successful.

        socket.send(
          JSON.stringify(otherStreamMessage) // Sending other stream message.
        );

        socket.send(
          JSON.stringify(streamMessage) // Sending current stream message.
        );
      });
    });
  });

  it("can trigger onCompletion method when websocket disconnects", done => {
    const realtimeAPI$ = new RealTimeAPI(url);
    realtimeAPI$.subscribe();
    mockServer.on("connection", (socket: WebSocket) => {
      expect(socket.url).toEqual(url); // Expecting websocket url. Connection Successful.

      realtimeAPI$.onCompletion(() => {
        done();
      });
      realtimeAPI$.disconnect();
    });
  });

  it("can trigger onMessage method on a new message from server", done => {
    const realtimeAPI$ = new RealTimeAPI(url);
    const testMessage = {
      msg: "test message"
    };
    realtimeAPI$.subscribe();
    mockServer.on("connection", (socket: WebSocket) => {
      expect(socket.url).toEqual(url); // Expecting websocket url. Connection Successful.

      realtimeAPI$.onMessage(message => {
        expect(message).toEqual(testMessage);
        done();
      });

      socket.send(JSON.stringify(testMessage));
    });
  });

  it("can trigger onError method on an error from server", done => {
    const realtimeAPI$ = new RealTimeAPI(url);

    realtimeAPI$.onError(error => {
      expect(error).toBeInstanceOf(Error); //Expecting an Error Instance
      expect(error.name).toEqual("SyntaxError"); // Expecting a SyntaxError
      done();
    });

    mockServer.on("connection", (socket: WebSocket) => {
      expect(socket.url).toEqual(url); // Expecting websocket url. Connection Successful.

      socket.send("Hello"); // Sending a String where JSON is expected. A "SyntaxError"
    });
  });

  it("can subscribe to websocket", done => {
    const realtimeAPI$ = new RealTimeAPI(url);

    const testMessage = {
      msg: "test message"
    };

    realtimeAPI$.subscribe(message => {
      expect(message).toEqual(testMessage);
      done();
    });

    mockServer.on("connection", (socket: WebSocket) => {
      expect(socket.url).toEqual(url); // Expecting websocket url. Connection Successful.

      socket.send(JSON.stringify(testMessage));
    });
  });

  it("can send message to server", done => {
    const realtimeAPI$ = new RealTimeAPI(url);

    const testMessage = {
      msg: "test message"
    };

    realtimeAPI$.subscribe();
    realtimeAPI$.sendMessage(testMessage);

    mockServer.on("connection", (socket: WebSocket) => {
      expect(socket.url).toEqual(url); // Expecting websocket url. Connection Successful.

      socket.on("message", message => {
        if (typeof message !== "string") {
          return;
        }
        expect(JSON.parse(message)).toEqual(testMessage);
        done();
      });
    });
  });
});
