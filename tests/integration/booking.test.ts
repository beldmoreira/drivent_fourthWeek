import app, { init } from "@/app";
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import {
  createUser,
  createBooking,
  createEnrollmentWithAddress,
  createTicketTypeWithHotel,
  createTicket,
  createPayment,
  createHotel,
  createRoomWithHotelId,
  createTicketTypeRemote,
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";
import { TicketStatus } from "@prisma/client";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /bookings", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/bookings");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/bookings").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/bookings").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  describe("when token is valid", () => {
    it("should respond with status 200 and a booking", async () => {
      const user = await createUser();
      const userId = user.id;
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const hotelId = hotel.id;
      const room = await createRoomWithHotelId(hotelId);
      const roomId = room.id;
      const createdBooking = await createBooking(userId, roomId);

      const response = await server.get("/bookings").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.OK);

      expect(response.body).toEqual({
        id: createdBooking.id,
        Room: {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          hotelId: room.hotelId,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        },
      });
    });
    it("should respond with status 404 when there is no enrollment for given user", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.get("/bookings").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("should respond with status 404 when the ticket type is remote for given user", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticket = await createTicketTypeRemote();
      await createTicket(enrollment.id, ticket.id, TicketStatus.PAID);
      const response = await server.get("/bookings").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("should respond with status 404 when the ticket has not been paid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticket = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticket.id, TicketStatus.RESERVED);
      const response = await server.get("/bookings").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
  });
});

describe("POST /bookings", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.post("/bookings");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.post("/bookings").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.post("/bookings").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    const createRandomBody = () => ({
      roomId: faker.datatype.number(),
    });

    it("should respond with status 200 and with its booking id", async () => {
      const user = await createUser();
      const userId = user.id;
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const hotelId = hotel.id;
      const room = await createRoomWithHotelId(hotelId);
      const roomId = room.id;
      const body = { roomId: roomId };
      await createBooking(userId, roomId);

      const response = await server.post("/bookings").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({
        id: expect.any(Number),
      });
    });

    it("should respond with status 403 when there is no enrollment for given user", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = createRandomBody();
      const response = await server.post("/bookings").set("Authorization", `Bearer ${token}`).send(body);

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
    it("should respond with status 403 when there is no ticket for given user", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = createRandomBody();
      await createEnrollmentWithAddress(user);
      const response = await server.post("/bookings").set("Authorization", `Bearer ${token}`).send(body);

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
    it("Should respond with 403 when user already have booking with room", async () => {
      const user = await createUser();
      const userId = user.id;
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const hotelId = hotel.id;
      const room = await createRoomWithHotelId(hotelId);
      const roomId = room.id;
      const body = { roomId: roomId };
      await createBooking(userId, roomId);

      const response = await server.post("/bookings").set("Authorization", `Bearer ${token}`).send(body);

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
    it("Should respond with 400 when the roomId does not exist", async () => {
      const user = await createUser();
      const userId = user.id;
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const hotelId = hotel.id;
      const room = await createRoomWithHotelId(hotelId);
      const roomId = room.id;
      await createBooking(userId, roomId);
      const body = { roomId: 0 };

      const response = await server.post("/bookings").set("Authorization", `Bearer ${token}`).send(body);

      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });
  });
});

describe("PUT /bookings/:bookingId", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.put("/bookings/1");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.put("/bookings/1").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.put("/bookings/1").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("When token is valid", () => {
    it("should respond with status 200 and a booking id", async () => {
      const user = await createUser();
      const userId = user.id;
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const hotelId = hotel.id;
      const room = await createRoomWithHotelId(hotelId);
      const anotherRoom = await createRoomWithHotelId(hotelId);
      const roomId = room.id;
      const booking = await createBooking(userId, roomId);

      const body = { roomId: anotherRoom.id };
      const response = await server.post("/bookings").set("Authorization", `Bearer ${token}`).send(body);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
        id: expect.any(Number),
      });
    });
  });
});
