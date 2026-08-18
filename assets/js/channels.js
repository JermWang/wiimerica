/* =====================================================================
   MIIMERICA — site configuration
   ---------------------------------------------------------------------
   This is the only file you need to edit for launch-day content.
   Everything else (layout, boot sequence, sounds) reads from here.
   ===================================================================== */

window.MIIMERICA = {

  /* -------------------------------------------------------------------
     1. TOKEN
     Paste the contract address between the quotes when you have it.
     While it is empty the site shows "COMING SOON" instead.
  ------------------------------------------------------------------- */
  contractAddress: "HC3XgUMQ2oeiQUz1af4WpjVKRz9aEJXwSHG8XsEJpump",

  /* Where "Start" sends people on the Buy channel.
     Leave a URL empty to hide that button.                            */
  links: {
    buy:     "",                         // e.g. pump.fun / Raydium / Uniswap link
    chart:   "",                         // e.g. DexScreener link
    twitter: "https://x.com/wiimerica_fun"
  },

  /* -------------------------------------------------------------------
     2. MEDIA FOLDERS
     thumbDir holds 720px JPEG copies of every image, used for the small
     channel tiles (0.9 MB total instead of 23 MB). Full-size originals
     from mediaDir are still used when a channel is opened.
     Regenerate after adding art:  npm run thumbs
  ------------------------------------------------------------------- */
  mediaDir: "public/wiimerica/",
  thumbDir: "public/thumbs/",

  /* -------------------------------------------------------------------
     3. CHANNELS
     12 per page, exactly like a real Wii. Add or remove freely —
     pages are generated automatically in groups of 12.

       title  : label under the channel when you hover it
       poster : still image shown on the tile (optional)
       video  : plays on hover, and full screen when opened (optional)
       body   : text shown on the channel page (optional)
       type   : "video" (default) | "buy" | "blank"
  ------------------------------------------------------------------- */
  channels: [

    /* ---------- PAGE 1 ---------- */
    /* THE PROMO — first channel on the menu. Full 54s cut, plays with sound.
       poster/video filenames still say "wiimerica" — that is the actual art
       on disk, unchanged; only the title/body copy below is renamed. */
    {
      title: "Miimerica Channel",
      poster: "wiimerica logo.png",
      video: "wiimerica PROMO 1.mp4",
      body: "Welcome to Miimerica. Everybody gets a channel."
    },
    {
      title: "Buy Miimerica",
      type: "buy",
      poster: "PFP.png",
      body: "Get your copy of Miimerica."
    },
    {
      title: "Cookout Channel",
      poster: "Firefly_Gemini Flash_Black family cookout__A giant American family cookout rendered like a Wii game. Cente 185182.png",
      video: "at_a_black_family_cook_out_all_the_fathers_are_secretely_huddled_up_around_the_grill_contemplating__u1p3a8i9wk6x5a9uwxy5_1.mp4",
      body: "Nobody knows who is watching the grill. Everybody is watching the grill."
    },
    {
      title: "Sidewalk Grill",
      video: "Characters_grilling_on_sidewalk_202608141835.mp4",
      body: "The grill is on the sidewalk now. This is fine."
    },
    {
      title: "Buzzball Channel",
      poster: "latina buzzball.png",
      video: "this_latina_girl_in_the_store_trying_to_buy_buzzballs_at_the_counter_but_shes_not_old_enough_so_the_wft6407mfrnesozyldiy_1.mp4",
      body: "The ID check nobody survives."
    },
    {
      title: "Buzzball Run",
      poster: "Firefly_Gemini Flash_a group of hoodrat latinas walking up to you and all holding buzzballs in their hand_ 300669.png",
      video: "buzzball neegy.mp4",
      body: "Round two. Bigger cans."
    },
    {
      title: "Wedding Channel",
      poster: "Firefly_Gemini Flash_Exterior of an enormous Indian-American wedding venue rendered like a cheerful Wii ga 185182.png",
      video: "an_indian_wedding_where_theyre_throwing_feces_at_the_bride_and_groom_and_everyone_loves_it_heavy_in_0dafi1vpkiqn2ovusu6s_1.mp4",
      body: "Eight hundred guests. Nobody knows the couple."
    },
    {
      title: "Karaoke Channel",
      poster: "Firefly_Gemini Flash_Filipino karaoke birthday__A Filipino-American family birthday party inside a suburba 185182.png",
      video: "35005898-14b5-460d-b443-c13403653490-video.mp4",
      body: "The machine has been on since Thursday."
    },
    {
      title: "Takeout Channel",
      poster: "eggrol.png",
      video: "Firefly asian man working at his restaurant answers the phone and asks if they would like the chicke.mp4",
      body: "You want chicken with that? You want chicken with that."
    },
    {
      title: "Split The Check",
      poster: "jews at table.png",
      video: "the_gentleman_are_fighting_over_who_has_to_pay_the_bill_because_none_of_them_want_to_and_theyre_bei_xfm4k1nk4ziqiuvn6zoq_1.mp4",
      body: "Six men. One check. No survivors."
    },
    {
      title: "Miami Channel",
      poster: "Firefly_Gemini Flash_a streamer guy in miami talking to his camera saying the girl behind him is ugly__kee 300669.png",
      video: "146e2376-643a-437c-9f78-d41217956dfe-video.mp4",
      body: "Live from the sidewalk, unfortunately."
    },
    {
      title: "Blaze Channel",
      poster: "Firefly_Gemini Flash_a jamaican guy smoking a joint and trying to pass it to a proper white business subur 300669.png",
      video: "hit da joint.mp4",
      body: "It is being passed. It is being declined. It is being passed again."
    },

    /* ---------- PAGE 2 ---------- */
    {
      title: "Street Ball",
      video: "Mii_characters_playing_street_ba…_202608141828.mp4",
      body: "Game to 21. Call your own fouls."
    },
    {
      title: "Scooter Channel",
      video: "Mii_riding_kick_scooter_202608141834.mp4",
      body: "No helmet. No plan. No brakes."
    },
    {
      title: "Block Party",
      video: "have_these_cholos_and_cholas_turning_up_and_saying_mexican_things_and_rolling_their_rs_when_they_sp_2r0a7l6z9y3nwniqjxap_1.mp4",
      body: "The speaker is bigger than the car."
    },
    {
      title: "Delivery Channel",
      video: "heavy_nerdy_voice_for_sound-_by_my_calculations_my_uber_eats_driver_should_be_getting_here_in_2_min_iktok36vyb81jb03vmc7_1.mp4",
      body: "By my calculations the driver arrives in two minutes."
    },
    {
      title: "Frat House",
      video: "please_take_these_characters_and_make_them_taking_whippits_of_galaxy_gas_have_them_have_a_frat_bro__kzq5mwqioctb3kaqhvcr_1.mp4",
      body: "Somebody bring the aux back."
    },
    {
      title: "Found A Penny",
      video: "these_people_are_all_in_a_circle_arguing_over_who_the_penny_on_the_ground_belongs_to_heavy_hebrew-a_olyg36gbfhe0v70cmzm6_1.mp4",
      body: "One cent. Eleven claimants."
    },
    {
      title: "The Circle",
      poster: "circle jerk.png",
      video: "circle jerk.mp4",
      body: "Everybody is talking. Nobody is listening."
    },
    {
      title: "Debate Channel",
      poster: "Firefly.png",
      video: "Firefly the gentleman are arguing over who has to pay the check, heavy new yorker jewish accent. 526.mp4",
      body: "Still arguing. Different table."
    },
    {
      title: "Late Show",
      video: "b09217c1-681d-4012-98fb-d732e3a6557c-video.mp4",
      body: "Prime time in Miimerica."
    },
    {
      title: "Work Channel",
      poster: "Mii_character_sitting_at_desk_202608141306.jpeg",
      body: "Nine to five. Allegedly."
    },
    {
      title: "Truck Channel",
      poster: "Man_standing_near_pickup_truck_202608141330.jpeg",
      body: "The truck has never hauled anything."
    }
    /* The promo used to sit here as its own channel. It is now channel 1,
       so the last slot on page 2 is left empty — the menu fills spare slots
       with the animated blank tile a real Wii shows. */
  ],

  /* -------------------------------------------------------------------
     4. WII MAIL — the envelope button, bottom right
  ------------------------------------------------------------------- */
  mail: [
    {
      from: "Miimerica",
      subject: "Welcome to Miimerica",
      body: "You have 24 channels and no responsibilities. Enjoy your stay."
    },
    {
      from: "Miimerica",
      subject: "A reminder",
      body: "This is a memecoin. It is a joke. Do not spend money you cannot afford to lose."
    }
  ],

  /* -------------------------------------------------------------------
     5. MUSIC — swap in any track from public/wiimerica/
  ------------------------------------------------------------------- */
  music: "Wii Music - Gaming Background Music (HD).mp3"
  // alternative: "Chief Keef - Earned It - Mii Channel Hip Hop Remix.mp3"
};
