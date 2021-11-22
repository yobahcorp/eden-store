const express = require('express');
const router = express.Router();
const { firestore, algoliaIndex, insights } = require('../initializers');

// logging
router.use((req, res, next) => {
    console.log("product request");
    next();
});

// fetching data
router.get('/:category/:type', async (req, res) => {
    console.log(req.params);

    var conditions;
    
    if(req.params.category === "all"){
        conditions = firestore.collection("products")
        .where("type", "==", req.params.type.toLowerCase());
    }else{
        conditions = firestore.collection("products")
        .where("category", "array-contains", req.params.category)
        .where("type" , "==", req.params.type.toLowerCase() );
        
    }
    
    // fetching data
    await conditions.limit(2).get()
    .then(docs => {
        var data = [];

        docs.docs.forEach(doc => {
            var details = doc.data();
            var value = 0;
            var rating;
            for(const key in details.rating){
                if (details.rating[key] > value) {
                    rating = key;
                    value = details.rating[key];
                };
            }
            details['topRating'] = rating;
            data.push(details);
        });
        // console.log(data)
         res.json({ products: data});
    })
    .catch( error => console.error(error));

});

// filter data
router.post('/:category/:type/:filters', async (req, res) => {
    var filters = JSON.parse(req.params.filters);
    console.log(filters);

    var conditions;
    
    if(req.params.category === "all"){
        conditions = firestore.collection("products")
        .where("type", "==", req.params.type.toLowerCase());
    }else{
        
        if (Object.keys(filters).length === 0){
            conditions = firestore.collection("products")
            .where("category", "array-contains", req.params.category)
            .where("type" , "==", req.params.type.toLowerCase() )
        } else {
            // contains brands and sellers
            if(Object.keys(filters).includes("brands") && Object.keys(filters).includes("sellers")){
                conditions = firestore.collection("products")
                .where("category", "array-contains", req.params.category)
                .where("type" , "==", req.params.type.toLowerCase() )
                .where("sellerId", "in", filters.sellers)
                .where("brand", "in", filters.brands)
                .where("price", ">=", filters.prices[0])
                .where("price", "<=", filters.prices[1]);
            } else if(Object.keys(filters).includes("brands")){
                conditions = firestore.collection("products")
                .where("category", "array-contains", req.params.category)
                .where("type" , "==", req.params.type.toLowerCase() )
                .where("brand", "in", filters.brands)
                .where("price", ">=", filters.prices[0])
                .where("price", "<=", filters.prices[1]);
            }else if(Object.keys(filters).includes("sellers")){
                conditions = firestore.collection("products")
                .where("category", "array-contains", req.params.category)
                .where("type" , "==", req.params.type.toLowerCase() )
                .where("sellerId", "in", filters.sellers)
                .where("price", ">=", filters.prices[0])
                .where("price", "<=", filters.prices[1]);
            }else{
                conditions = firestore.collection("products")
                .where("category", "array-contains", req.params.category)
                .where("type" , "==", req.params.type.toLowerCase() )
                .where("price", ">=", filters.prices[0])
                .where("price", "<=", filters.prices[1]);
            }
        }

        
        
    }
    
    // fetching data
    await conditions.limit(2).get()
    .then(docs => {
        var data = [];

        docs.docs.forEach(doc => {
            var details = doc.data();
            var value = 0;
            var rating;
            for(const key in details.rating){
                if (details.rating[key] > value) {
                    rating = key;
                    value = details.rating[key];
                };
            }
            details['topRating'] = rating;

            if(Object.keys(filters).length !== 0){
                if(details.discount >= filters.discounts[0] && details.discount <= filters.discounts[1]){
                    data.push(details);
                }
            }else{
                data.push(details);
            }
        });
        // console.log(data)
         res.json({ products: data});
    })
    .catch( error => console.error(error));

});

// details of a particular product
router.get('/details/:id/:userId', async (req, res) => {
    console.log("Product detail request")

    // sending click event
    insights("clickedObjectIDsAfterSearch", {
        userToken: req.params.userId,
        index: "eden_products",
        eventName: "Clicked Item",
        objectIDs: [req.params.id]
    });

    console.log("Event registered");

    // fetching data
    await firestore.collection("products")
    .where("id" , "==", req.params.id )
    .get()
    .then(async response => {
        // console.log(data)
        // fetching offer for this product if any
        await firestore.collection('offers')
        .where("products", "array-contains", req.params.id)
        .get()
        .then(async fDocs => {
            var hasOffer = false;

            // console.log(fDocs.docs)
            if(fDocs.docs.length !== 0){
                hasOffer = true;
            }

            // fetching related items
            await firestore.collection("products")
            .where("category", "array-contains", response.docs[0].data().category[0])
            .limit(12)
            .get()
            .then( docs => {
                var related = [];

                docs.docs.forEach( doc => {
                    related.push(doc.data())
                });
                
                // returning data
            if(!hasOffer) res.json({data: response.docs[0].data(), related: related, hasOffer: hasOffer, offer: null });
            else res.json({data: response.docs[0].data(), related: related, hasOffer: hasOffer, offer: fDocs.docs[0].data() });
            })
            .catch( error => console.log(error));
        })
        .catch( error => console.log(error));

        
    })
    .catch( error => console.error(error));
});

// search
router.post('/search', (req, res) => {
    
    // for all categories
    if (req.body.category === "all"){
        algoliaIndex.search(req.body.searchText)
        .then( hits => {
            console.log(hits);
             res.json({ result: hits });
        })
        .catch( error => console.log(error));
    }else{
        algoliaIndex.search(req.body.searchText, { filters: `category:${ req.body.category.substring(0, 1).toUpperCase() + req.body.category.slice(1) }`})
        .then( hits => {
            console.log(hits);
             res.json({ result: hits });
        })
        .catch( error => console.log(error));
    }
});

router.get('/filters', async (req, res) => {
    await firestore.collection("products").get()
    .then( response => {
    
        var minPrice = response.docs[0].data().price;
        var maxPrice = response.docs[0].data().price;
        var sellerIds = [];
        var brands = [];
        
        response.docs.forEach( doc => {
            var price = parseFloat(doc.data().price);
            if (minPrice > price) minPrice = price;
            if (maxPrice < price) maxPrice = price;
            brands.push(doc.data().brand);
            sellerIds.push(doc.data().sellerId)
        });
         
        res.json({
            prices: { min: minPrice, max: maxPrice },
            brands: Array.from(new Set(brands)),
            rates: { min: 0, max: 5 },
            sellers: Array.from(new Set(sellerIds)),
            discounts: { min: 1, max: 100 }
        });

    })
    .catch( error => console.log(error));
});

router.post('/rating', async (req, res) => {
   console.log(req.body);

   // get product
    firestore.collection("products").where("id", "==", req.body.id).get()
    .then( response => {
        // get current rating
        var rating = response.docs[0].data().rating;

        // increase rating count
        rating[`${ req.body.rating }`] += 1;

        // save new rating
        firestore.collection("products").doc(response.docs[0].id).update({ rating: rating })
        .then( (response) => res.json({status: 200}))
        .catch( error => console.log(error));
    }).catch( error => console.log(error));

    await firestore.collection("orders").doc("CompletedAndPending").collection("PendingOrders")
    .where("id", "==", req.body.id).where("userId", "==", req.body.uid).get()
    .then( (response) => {
        firestore.collection("orders").doc("CompletedAndPending").collection("PendingOrders")
        .doc(response.docs[0].id).update({ reviewed: true })
        .then( (response) => console.log("reviewed"))
        .catch( error => console.log(error));
    })
    .catch( error => console.log(error));
    
});

module.exports = router;