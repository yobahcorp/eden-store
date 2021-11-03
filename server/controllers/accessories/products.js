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
    
    if(req.params.category == "all"){
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
            data.push(doc.data());
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
            if(fDocs.docs.length !=0){
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
    if (req.body.category == "all"){
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

module.exports = router;